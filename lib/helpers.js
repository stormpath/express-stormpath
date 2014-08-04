'use strict';


var jade = require('jade');
var mixin = require('utils-merge');
var stormpath = require('stormpath');


/**
 * This callback, when called, will simply continue processing the HTTP
 * request.
 *
 * @callback nextCallback
 * @private
 */


/**
 * Titlecase a string.
 *
 * @method
 * @private
 *
 * @param {String} - A string to titlecase.
 *
 * @return {String} A titlecased string.
 */
module.exports.title = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};


/**
 * Render a Jade view using app locals.
 *
 * This is necessary because our library can't rely on the developer using Jade
 * view as well -- so this allows us to use Jade templates for our library
 * views, without negatively affecting the developer's application.
 *
 * @method
 * @private
 *
 * @param {String} view - The filename to the Jade view to render.
 * @param {Object} res - The http response.
 * @param {Object} options - The locals which will be supplied to the view
 *   during rendering.
 */
module.exports.render = function(view, res, options) {
  options = options || {};
  mixin(options, res.locals);

  jade.renderFile(view, options, function(err, html) {
    if (err) throw err;
    res.send(html);
  });
};


/**
 * Attempts to retrieve a user object from either the session, a user's API
 * keys, or a user's OAuth tokens, making it available in the current context.
 * If a user cannot be found, nothing will be done and the request will
 * continue processing.
 *
 * @method
 * @private
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {nextCallback} next - The callback which is called to continue
 *   processing the request.
 */
module.exports.getUser = function(req, res, next) {

  // In the event this has already been run (this can happen due to Express
  // routing logic) -- don't re-run this function.
  if (res.locals.user) {
    next();
  }

  // Here we'll check to see whether or not there is an HTTP Authorization
  // header set.  If so, this means the user is trying to identify via API
  // authentication.
  if (req.headers.authorization) {
    req.app.get('stormpathApplication').authenticateApiRequest({ request: req }, function(err, authResult) {
      if (err) {
        next();
      } else {
        authResult.getAccount(function(err, account) {
          if (!err) {
            res.locals.user = account;
            res.locals.permissions = authResult.grantedScopes;
          }
          next();
        });
      }
    });

  // If there is session data, we'll fetch the user from Stormpath.
  } else if (req.session && req.session.user) {
    req.app.get('stormpathClient').getAccount(req.session.user.href, { expand: 'customData,groups' }, function(err, account) {
      if (err) {
        req.session.reset();
      } else {
        req.session.user = account;
        res.locals.user = account;
      }
      next();
    });

  // Otherwise, there is no user information, so simply continue processing
  // without setting the user.
  } else {
    next();
  }

};


/**
 * Initialize all Stormpath settings.
 *
 * @method
 * @private
 *
 * @param {Object} app - The express application.
 * @param {Object} opts - A JSON hash of user supplied options.
 *
 * @return {Function} A function which accepts a callback.
 */
module.exports.initSettings = function(app, opts) {
  return function(next) {
    // Basic credentials and configuration.
    app.set('stormpathApiKeyId', opts.apiKeyId || process.env.STORMPATH_API_KEY_ID);
    app.set('stormpathApiKeySecret', opts.apiKeySecret || process.env.STORMPATH_API_KEY_SECRET);
    app.set('stormpathApiKeyFile', opts.apiKeyFile || process.env.STORMPATH_API_KEY_FILE);
    app.set('stormpathApplication', opts.application || process.env.STORMPATH_APPLICATION);

    // Session configuration.
    app.set('stormpathSecretKey', opts.secretKey || process.env.STORMPATH_SECRET_KEY);
    app.set('stormpathEnableHttps', opts.enableHttps || process.env.STORMPATH_ENABLE_HTTPS || false);
    app.set('stormpathSessionDuration', opts.sessionDuration || parseInt(process.env.STORMPATH_SESSION_DURATION) || 1000 * 60 * 30);

    // Cache configuration.
    app.set('stormpathCache', opts.cache || process.env.STORMPATH_CACHE || 'memory');
    app.set('stormpathCacheHost', opts.cacheHost || process.env.STORMPATH_CACHE_HOST || undefined);
    app.set('stormpathCachePort', opts.cachePort || parseInt(process.env.STORMPATH_CACHE_PORT) || undefined);
    app.set('stormpathCacheTTL', opts.cacheTTL || parseInt(process.env.STORMPATH_CACHE_TTL) || 300);
    app.set('stormpathCacheTTI', opts.cacheTTI || parseInt(process.env.STORMPATH_CACHE_TTI) || 300);
    app.set('stormpathCacheOptions', opts.cacheOptions || JSON.parse(process.env.STORMPATH_CACHE_OPTIONS || '{}') || {});

    // Oauth configuration.
    app.set('stormpathOauthTTL', opts.oauthTTL || parseInt(process.env.STORMPATH_OAUTH_TTL) || 3600);

    // Social configuration.
    app.set('stormpathSocial', opts.social || JSON.parse(process.env.STORMPATH_SOCIAL || '{}') || {})

    // Which fields should we display when registering new users?
    app.set('stormpathEnableUsername', opts.enableUsername || (process.env.STORMPATH_ENABLE_USERNAME === 'true') || false);
    app.set('stormpathEnableGivenName', opts.enableGivenName || (process.env.STORMPATH_ENABLE_GIVEN_NAME === 'true') || true);
    app.set('stormpathEnableMiddleName', opts.enableMiddleName || (process.env.STORMPATH_ENABLE_MIDDLE_NAME === 'true') || false);
    app.set('stormpathEnableSurname', opts.enableSurname || (process.env.STORMPATH_ENABLE_SURNAME === 'true') || true);
    app.set('stormpathEnableEmail', opts.enableEmail || (process.env.STORMPATH_ENABLE_EMAIL === 'true') || true);
    app.set('stormpathEnablePassword', opts.enablePassword || (process.env.STORMPATH_ENABLE_EMAIL === 'true') || true);

    // Which fields should we require when creating new users?
    app.set('stormpathRequireUsername', opts.requireUsername || (process.env.STORMPATH_REQUIRE_USERNAME === 'true') || false);
    app.set('stormpathRequireGivenName', opts.requireGivenName || (process.env.STORMPATH_REQUIRE_GIVEN_NAME === 'true') || true);
    app.set('stormpathRequireMiddleName', opts.requireMiddleName || (process.env.STORMPATH_REQUIRE_MIDDLE_NAME === 'true') || false);
    app.set('stormpathRequireSurname', opts.requireSurname || (process.env.STORMPATH_REQUIRE_SURNAME === 'true') || true);
    app.set('stormpathRequireEmail', opts.requireEmail || (process.env.STORMPATH_REQUIRE_EMAIL === 'true') || true);
    app.set('stormpathRequirePassword', opts.requirePassword || (process.env.STORMPATH_REQUIRE_PASSWORD === 'true') || true);

    // Which controllers should we enable?
    app.set('stormpathEnableRegistration', opts.enableRegistration || (process.env.STORMPATH_ENABLE_REGISTRATION === 'true') || true);
    app.set('stormpathEnableLogin', opts.enableLogin || (process.env.STORMPATH_ENABLE_LOGIN === 'true') || true);
    app.set('stormpathEnableLogout', opts.enableLogout || (process.env.STORMPATH_ENABLE_LOGOUT === 'true') || true);
    app.set('stormpathEnableForgotPassword', opts.enableForgotPassword || (process.env.STORMPATH_ENABLE_FORGOT_PASSWORD === 'true') || false);
    app.set('stormpathEnableAccountVerification', opts.enableAccountVerification || (process.env.STORMPATH_ENABLE_ACCOUNT_VERIFICATION === 'true') || false);
    app.set('stormpathEnableFacebook', opts.enableFacebook || (process.env.STORMPATH_ENABLE_FACEBOOK === 'true') || false);
    app.set('stormpathEnableGoogle', opts.enableGoogle || (process.env.STORMPATH_ENABLE_GOOGLE === 'true') || false);
    app.set('stormpathEnableIdSite', opts.enableIdSite || (process.env.STORMPATH_ENABLE_ID_SITE === 'true') || false);

    // Which views should we render?
    app.set('stormpathRegistrationView', opts.registrationView || process.env.STORMPATH_REGISTRATION_VIEW || __dirname + '/views/register.jade');
    app.set('stormpathLoginView', opts.loginView || process.env.STORMPATH_LOGIN_VIEW || __dirname + '/views/login.jade');
    app.set('stormpathForgotPasswordView', opts.forgotPasswordView || process.env.STORMPATH_FORGOT_PASSWORD_VIEW || __dirname + '/views/forgot.jade');
    app.set('stormpathForgotPasswordEmailSentView', opts.forgotPasswordEmailSentView || process.env.STORMPATH_FORGOT_PASSWORD_EMAIL_SENT_VIEW || __dirname + '/views/forgot_email_sent.jade');
    app.set('stormpathForgotPasswordChangeView', opts.forgotPasswordChangeView || process.env.STORMPATH_FORGOT_PASSWORD_CHANGE_VIEW || __dirname + '/views/forgot_change.jade');
    app.set('stormpathForgotPasswordCompleteView', opts.forgotPasswordCompleteView || process.env.STORMPATH_FORGOT_PASSWORD_COMPLETE_VIEW || __dirname + '/views/forgot_complete.jade');
    app.set('stormpathAccountVerificationEmailSentView', opts.forgotAccountVerificationEmailSentView || process.env.STORMPATH_ACCOUNT_VERIFICATION_EMAIL_SENT_VIEW || __dirname + '/views/verification_email_sent.jade');
    app.set('stormpathAccountVerificationCompleteView', opts.forgotAccountVerificationCompleteView || process.env.STORMPATH_ACCOUNT_VERIFICATION_COMPLETE_VIEW || __dirname + '/views/verification_complete.jade');

    // Routing configuration.
    app.set('stormpathRegistrationUrl', opts.registrationUrl || process.env.STORMPATH_REGISTRATION_URL || '/register');
    app.set('stormpathLoginUrl', opts.loginUrl || process.env.STORMPATH_LOGIN_URL || '/login');
    app.set('stormpathLogoutUrl', opts.logoutUrl || process.env.STORMPATH_LOGOUT_URL || '/logout');
    app.set('stormpathForgotPasswordUrl', opts.forgotPasswordUrl || process.env.STORMPATH_FORGOT_PASSWORD_URL || '/forgot');
    app.set('stormpathForgotPasswordChangeUrl', opts.forgotPasswordChangeUrl || process.env.STORMPATH_FORGOT_PASSWORD_CHANGE_URL || '/forgot/change');
    app.set('stormpathAccountVerificationCompleteUrl', opts.accountVerificationCompleteUrl || process.env.STORMPATH_ACCOUNT_VERIFICATION_COMPLETE_URL || '/verified');
    app.set('stormpathGetOauthTokenUrl', opts.getOauthTokenUrl || process.env.STORMPATH_GET_OAUTH_TOKEN_URL || '/oauth');
    app.set('stormpathRedirectUrl', opts.redirectUrl || process.env.STORMPATH_REDIRECT_URL || '/');
    app.set('stormpathFacebookLoginUrl', opts.facebookLoginUrl || process.env.STORMPATH_FACEBOOK_LOGIN_URL || '/facebook');
    app.set('stormpathGoogleLoginUrl', opts.googleLoginUrl || process.env.STORMPATH_GOOGLE_LOGIN_URL || '/google');
    app.set('stormpathIdSiteUrl', opts.idSiteUrl || process.env.STORMPATH_ID_SITE_URL || '/redirect');
    app.set('stormpathIdSiteRegistrationUrl', opts.idSiteRegistrationUrl || process.env.STORMPATH_ID_SITE_REGISTRATION_URL || '/#register');

    next();
  };
};


/**
 * Verify that all user supplied settings are properly configured.
 *
 * @method
 * @private
 *
 * @param {Object} app - The express application.
 *
 * @return {Function} A function which accepts a callback.
 */
module.exports.checkSettings = function(app) {
  return function(next) {
    if (!app.get('stormpathSecretKey')) {
      throw new Error('ERROR: No Stormpath secretKey specified.');
    }

    if (!(
      (app.get('stormpathApiKeyId') && app.get('stormpathApiKeySecret')) ||
      app.get('stormpathApiKeyFile')
    )) {
      throw new Error('ERROR: No Stormpath credentials specified.');
    }

    if (!app.get('stormpathApplication')) {
      throw new Error('ERROR: No Stormpath application specified.');
    }

    next();
  };
};
