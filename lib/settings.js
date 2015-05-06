'use strict';

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var winston = require('winston');

/**
 * Determine which value to use for a specified setting.
 *
 * @method
 * @private
 *
 * @param {Array} variables - An array of possible variable values, in the order
 *   in which they should be used.
 * @param {*} value - The value to use if at least one of the variables exists.
 * @param {*} defaultValue - The default value to use if the variables are all
 *   undefined.
 *
 * @return {*} The proper value, based on the given variables.
 */
function getValue(variables, value, defaultValue) {
  var specified = false;

  for (var i = 0; i < variables.length; i++) {
    if (variables[i] !== undefined) {
      specified = true;
      break;
    }
  }

  return specified ? value : defaultValue;
}

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
module.exports.init = function(app, opts) {
  opts = opts || {};

  // Basic credentials and configuration.
  app.set('stormpathApiKeyId', opts.apiKeyId || process.env.STORMPATH_API_KEY_ID);
  app.set('stormpathApiKeySecret', opts.apiKeySecret || process.env.STORMPATH_API_KEY_SECRET);
  app.set('stormpathApiKeyFile', opts.apiKeyFile || process.env.STORMPATH_API_KEY_FILE);
  app.set('stormpathApplication', opts.application || process.env.STORMPATH_APPLICATION || process.env.STORMPATH_URL);
  app.set('stormpathDebug', opts.debug || (process.env.STORMPATH_DEBUG === 'true') || false);

  // Session configuration.
  app.set('stormpathSecretKey', opts.secretKey || process.env.STORMPATH_SECRET_KEY);
  app.set('stormpathEnableHttps', opts.enableHttps || process.env.STORMPATH_ENABLE_HTTPS || false);
  app.set('stormpathSessionDuration', opts.sessionDuration || parseInt(process.env.STORMPATH_SESSION_DURATION) || 1000 * 60 * 30);
  app.set('stormpathSessionActiveDuration', opts.sessionActiveDuration || parseInt(process.env.STORMPATH_SESSION_ACTIVE_DURATION) || 1000 * 60 * 5);
  app.set('stormpathSessionDomain', opts.sessionDomain || process.env.STORMPATH_SESSION_DOMAIN || undefined);
  app.set('stormpathSessionMiddleware', opts.sessionMiddleware || undefined);

  // Cache configuration.
  app.set('stormpathCache', opts.cache || process.env.STORMPATH_CACHE || 'memory');
  app.set('stormpathCacheHost', opts.cacheHost || process.env.STORMPATH_CACHE_HOST || undefined);
  app.set('stormpathCachePort', opts.cachePort || parseInt(process.env.STORMPATH_CACHE_PORT) || undefined);
  app.set('stormpathCacheTTL', opts.cacheTTL || parseInt(process.env.STORMPATH_CACHE_TTL) || 300);
  app.set('stormpathCacheTTI', opts.cacheTTI || parseInt(process.env.STORMPATH_CACHE_TTI) || 300);
  app.set('stormpathCacheOptions', opts.cacheOptions || JSON.parse(process.env.STORMPATH_CACHE_OPTIONS || '{}') || {});
  app.set('stormpathCacheClient', opts.cacheClient || undefined);

  // Oauth configuration.
  app.set('stormpathOauthTTL', opts.oauthTTL || parseInt(process.env.STORMPATH_OAUTH_TTL) || 3600);

  // Social configuration.
  app.set('stormpathSocial', opts.social || JSON.parse(process.env.STORMPATH_SOCIAL || '{}') || {});

  // Which fields should we display when registering new users?
  app.set('stormpathEnableUsername', opts.enableUsername || (process.env.STORMPATH_ENABLE_USERNAME === 'true') || false);
  app.set('stormpathEnableConfirmPassword', opts.enableConfirmPassword || (process.env.STORMPATH_ENABLE_CONFIRM_PASSWORD === 'true') || false);
  app.set('stormpathEnableGivenName', getValue(
    [ opts.enableGivenName, process.env.STORMPATH_ENABLE_GIVEN_NAME ],
    opts.enableGivenName || (process.env.STORMPATH_ENABLE_GIVEN_NAME === 'true'),
    true
  ));
  app.set('stormpathEnableMiddleName', opts.enableMiddleName || (process.env.STORMPATH_ENABLE_MIDDLE_NAME === 'true') || false);
  app.set('stormpathEnableSurname', getValue(
    [ opts.enableSurname, process.env.STORMPATH_ENABLE_SURNAME ],
    opts.enableSurname || (process.env.STORMPATH_ENABLE_SURNAME === 'true'),
    true
  ));
  app.set('stormpathEnableEmail', getValue(
    [ opts.enableEmail, process.env.STORMPATH_ENABLE_EMAIL ],
    opts.enableEmail || (process.env.STORMPATH_ENABLE_EMAIL === 'true'),
    true
  ));
  app.set('stormpathEnablePassword', getValue(
    [ opts.enablePassword, process.env.STORMPATH_ENABLE_EMAIL ],
    opts.enablePassword || (process.env.STORMPATH_ENABLE_EMAIL === 'true'),
    true
  ));

  // Which fields should we require when creating new users?
  app.set('stormpathRequireUsername', opts.requireUsername || (process.env.STORMPATH_REQUIRE_USERNAME === 'true') || false);
  app.set('stormpathRequireConfirmPassword', opts.requireConfirmPassword || (process.env.STORMPATH_REQUIRE_CONFIRM_PASSWORD === 'true') || false);
  app.set('stormpathRequireGivenName', getValue(
    [ opts.requireGivenName, process.env.STORMPATH_REQUIRE_GIVEN_NAME ],
    opts.requireGivenName || (process.env.STORMPATH_REQUIRE_GIVEN_NAME === 'true'),
    true
  ));
  app.set('stormpathRequireMiddleName', opts.requireMiddleName || (process.env.STORMPATH_REQUIRE_MIDDLE_NAME === 'true') || false);
  app.set('stormpathRequireSurname', getValue(
    [ opts.requireSurname, process.env.STORMPATH_REQUIRE_SURNAME ],
    opts.requireSurname || (process.env.STORMPATH_REQUIRE_SURNAME === 'true'),
    true
  ));
  app.set('stormpathRequireEmail', getValue(
    [ opts.requireEmail, process.env.STORMPATH_REQUIRE_EMAIL ],
    opts.requireEmail || (process.env.STORMPATH_REQUIRE_EMAIL === 'true'),
    true
  ));
  app.set('stormpathRequirePassword', getValue(
    [ opts.requirePassword, process.env.STORMPATH_REQUIRE_PASSWORD ],
    opts.requirePassword || (process.env.STORMPATH_REQUIRE_PASSWORD === 'true'),
    true
  ));

  // Which controllers should we enable?
  app.set('stormpathEnableRegistration', getValue(
    [ opts.enableRegistration, process.env.STORMPATH_ENABLE_REGISTRATION ],
    opts.enableRegistration || (process.env.STORMPATH_ENABLE_REGISTRATION === 'true'),
    true
  ));
  app.set('stormpathEnableLogin', getValue(
    [ opts.enableLogin, process.env.STORMPATH_ENABLE_LOGIN ],
    opts.enableLogin || (process.env.STORMPATH_ENABLE_LOGIN === 'true'),
    true
  ));
  app.set('stormpathEnableLogout', getValue(
    [ opts.enableLogout, process.env.STORMPATH_ENABLE_LOGOUT ],
    opts.enableLogout || (process.env.STORMPATH_ENABLE_LOGOUT === 'true'),
    true
  ));
  app.set('stormpathEnableForgotPassword', opts.enableForgotPassword || (process.env.STORMPATH_ENABLE_FORGOT_PASSWORD === 'true') || false);
  app.set('stormpathEnableAccountVerification', opts.enableAccountVerification || (process.env.STORMPATH_ENABLE_ACCOUNT_VERIFICATION === 'true') || false);
  app.set('stormpathEnableFacebook', opts.enableFacebook || (process.env.STORMPATH_ENABLE_FACEBOOK === 'true') || false);
  app.set('stormpathEnableGoogle', opts.enableGoogle || (process.env.STORMPATH_ENABLE_GOOGLE === 'true') || false);
  app.set('stormpathEnableIdSite', opts.enableIdSite || (process.env.STORMPATH_ENABLE_ID_SITE === 'true') || false);
  app.set('stormpathEnableAutoLogin', opts.enableAutoLogin || (process.env.STORMPATH_ENABLE_AUTO_LOGIN === 'true') || false);
  app.set('stormpathEnableForgotPasswordChangeAutoLogin', opts.enableForgotPasswordChangeAutoLogin || (process.env.STORMPATH_ENABLE_FORGOT_PASSWORD_CHANGE_AUTO_LOGIN === 'true') || false);

  // Expansion functionality.
  app.set('stormpathExpandApiKeys', opts.expandApiKeys || (process.env.STORMPATH_EXPAND_API_KEYS === 'true') || false);
  app.set('stormpathExpandCustomData', opts.expandCustomData || (process.env.STORMPATH_EXPAND_CUSTOM_DATA === 'true') || false);
  app.set('stormpathExpandDirectory', opts.expandDirectory || (process.env.STORMPATH_EXPAND_DIRECTORY === 'true') || false);
  app.set('stormpathExpandGroups', opts.expandGroups || (process.env.STORMPATH_EXPAND_GROUPS === 'true') || false);
  app.set('stormpathExpandGroupMemberships', opts.expandGroupMemberships || (process.env.STORMPATH_EXPAND_GROUP_MEMBERSHIPS === 'true') || false);
  app.set('stormpathExpandProviderData', opts.expandProviderData || (process.env.STORMPATH_EXPAND_PROVIDER_DATA === 'true') || false);
  app.set('stormpathExpandTenant', opts.expandTenant || (process.env.STORMPATH_EXPAND_TENANT === 'true') || false);

  // Custom functionality.
  app.set('stormpathPostLoginHandler', opts.postLoginHandler);
  app.set('stormpathPostRegistrationHandler', opts.postRegistrationHandler);

  // Template data.
  app.set('stormpathTemplateContext', opts.templateContext || JSON.parse(process.env.STORMPATH_TEMPLATE_CONTEXT || '{}') || {});

   // Render handler.
  app.set('stormpathRenderHandler', opts.renderHandler || undefined);

  // Which views should we render?
  app.set('stormpathRegistrationView', opts.registrationView || process.env.STORMPATH_REGISTRATION_VIEW || __dirname + '/views/register.jade');
  app.set('stormpathLoginView', opts.loginView || process.env.STORMPATH_LOGIN_VIEW || __dirname + '/views/login.jade');
  app.set('stormpathResendAccountVerificationEmailView', opts.resendAccountVerificationView || process.env.STORMPATH_RESEND_ACCOUNT_VERIFICATION_VIEW || __dirname + '/views/verification_resend.jade');
  app.set('stormpathForgotPasswordView', opts.forgotPasswordView || process.env.STORMPATH_FORGOT_PASSWORD_VIEW || __dirname + '/views/forgot.jade');
  app.set('stormpathForgotPasswordEmailSentView', opts.forgotPasswordEmailSentView || process.env.STORMPATH_FORGOT_PASSWORD_EMAIL_SENT_VIEW || __dirname + '/views/forgot_email_sent.jade');
  app.set('stormpathForgotPasswordChangeView', opts.forgotPasswordChangeView || process.env.STORMPATH_FORGOT_PASSWORD_CHANGE_VIEW || __dirname + '/views/forgot_change.jade');
  app.set('stormpathForgotPasswordChangeFailedView', opts.forgotPasswordChangeFailedView || process.env.STORMPATH_FORGOT_PASSWORD_CHANGE_FAILED_VIEW || __dirname + '/views/forgot_change_failed.jade');
  app.set('stormpathForgotPasswordCompleteView', opts.forgotPasswordCompleteView || process.env.STORMPATH_FORGOT_PASSWORD_COMPLETE_VIEW || __dirname + '/views/forgot_complete.jade');
  app.set('stormpathAccountVerificationEmailSentView', opts.accountVerificationEmailSentView || process.env.STORMPATH_ACCOUNT_VERIFICATION_EMAIL_SENT_VIEW || __dirname + '/views/verification_email_sent.jade');
  app.set('stormpathAccountVerificationCompleteView', opts.accountVerificationCompleteView || process.env.STORMPATH_ACCOUNT_VERIFICATION_COMPLETE_VIEW || __dirname + '/views/verification_complete.jade');
  app.set('stormpathAccountVerificationFailedView', opts.accountVerificationFailedView || process.env.STORMPATH_ACCOUNT_VERIFICATION_FAILED_VIEW || __dirname + '/views/verification_failed.jade');
  app.set('stormpathIdSiteVerificationFailedView', opts.idSiteVerificationFailedView || process.env.STORMPATH_ID_SITE_VERIFICATION_FAILED_VIEW || __dirname + '/views/id_site_verification_failed.jade');
  app.set('stormpathGoogleLoginFailedView', opts.googleLoginFailedView || process.env.STORMPATH_GOOGLE_LOGIN_FAILED_VIEW || __dirname + '/views/google_login_failed.jade');
  app.set('stormpathFacebookLoginFailedView', opts.facebookLoginFailedView || process.env.STORMPATH_FACEBOOK_LOGIN_FAILED_VIEW || __dirname + '/views/facebook_login_failed.jade');
  app.set('stormpathUnauthorizedView', opts.unauthorizedView || process.env.STORMPATH_UNAUTHORIZED_VIEW || __dirname + '/views/unauthorized.jade');

  // Routing configuration.
  app.set('stormpathRegistrationUrl', opts.registrationUrl || process.env.STORMPATH_REGISTRATION_URL || '/register');
  app.set('stormpathLoginUrl', opts.loginUrl || process.env.STORMPATH_LOGIN_URL || '/login');
  app.set('stormpathLogoutUrl', opts.logoutUrl || process.env.STORMPATH_LOGOUT_URL || '/logout');
  app.set('stormpathPostLogoutRedirectUrl', opts.postLogoutRedirectUrl || process.env.STORMPATH_POST_LOGOUT_REDIRECT_URL || '/');
  app.set('stormpathResendAccountVerificationEmailUrl', opts.resendAccountVerificationEmailUrl || process.env.STORMPATH_RESEND_ACCOUNT_VERIFICATION_EMAIL_URL || '/verification/resend');
  app.set('stormpathForgotPasswordUrl', opts.forgotPasswordUrl || process.env.STORMPATH_FORGOT_PASSWORD_URL || '/forgot');
  app.set('stormpathPostForgotPasswordRedirectUrl', opts.postForgotPasswordRedirectUrl || process.env.STORMPATH_POST_FORGOT_PASSWORD_REDIRECT_URL || '/forgot/sent');
  app.set('stormpathForgotPasswordChangeUrl', opts.forgotPasswordChangeUrl || process.env.STORMPATH_FORGOT_PASSWORD_CHANGE_URL || '/forgot/change');
  app.set('stormpathPostForgotPasswordChangeRedirectUrl', opts.postForgotPasswordChangeRedirectUrl || process.env.STORMPATH_POST_FORGOT_PASSWORD_CHANGE_REDIRECT_URL || '/forgot/change/done');
  app.set('stormpathAccountVerificationCompleteUrl', opts.accountVerificationCompleteUrl || process.env.STORMPATH_ACCOUNT_VERIFICATION_COMPLETE_URL || '/verified');
  app.set('stormpathGetOauthTokenUrl', opts.getOauthTokenUrl || process.env.STORMPATH_GET_OAUTH_TOKEN_URL || '/oauth');
  app.set('stormpathRedirectUrl', opts.redirectUrl || process.env.STORMPATH_REDIRECT_URL || '/');
  app.set('stormpathFacebookLoginUrl', opts.facebookLoginUrl || process.env.STORMPATH_FACEBOOK_LOGIN_URL || '/facebook');
  app.set('stormpathGoogleLoginUrl', opts.googleLoginUrl || process.env.STORMPATH_GOOGLE_LOGIN_URL || '/google');
  app.set('stormpathIdSiteUrl', opts.idSiteUrl || process.env.STORMPATH_ID_SITE_URL || '/redirect');
  app.set('stormpathIdSiteRegistrationUrl', opts.idSiteRegistrationUrl || process.env.STORMPATH_ID_SITE_REGISTRATION_URL || '/#register');
};

/**
 * Prepare our Application settings.
 *
 * This will clean up any user-supplied settings, trying to fix common issues
 * like relative vs. absolute file paths, etc.
 *
 * This is a helper function.
 *
 * @method
 * @private
 *
 * @param {Object} app - The express application.
 */
module.exports.prep = function(app) {
  var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var apiKeyFile = path.join(homeDir, '.stormpath', 'apiKey.properties');

  // If no secret key is specified, we'll use a random string (48 bytes).
  // This means your sessions will only last until the server is restarted
  // (bad idea for production).
  if (!app.get('stormpathSecretKey')) {
    app.set('stormpathSecretKey', crypto.randomBytes(48).toString('hex'));
  }

  // If no credentials are specified, we'll go ahead and look for either:
  //
  //  - apiKey.properties, or
  //  - ~/.stormpath/apiKey.properties
  //
  // to pull information from.
  if (!(
    (app.get('stormpathApiKeyId') && app.get('stormpathApiKeySecret')) ||
    app.get('stormpathApiKeyFile')
  )) {
    if (fs.existsSync('apiKey.properties')) {
      app.set('stormpathApiKeyFile', 'apiKey.properties');
    } else if (fs.existsSync(apiKeyFile)) {
      app.set('stormpathApiKeyFile', apiKeyFile);
    }
  }

  // If no logger exists, we'll go ahead and create one with the appropriate
  // logging levels.
  if (!app.get('stormpathLogger')) {
    app.set('stormpathLogger', new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
          level: app.get('stormpathDebug') ? 'info' : 'error',
        })
      ]
    }));
  }
};

/**
 * Verify that all user supplied settings are properly configured.
 *
 * @method
 * @private
 *
 * @param {Object} app - The express application.
 */
module.exports.validate = function(app) {
  if (app.get('stormpathApiKeyFile')) {
    if (!fs.existsSync(app.get('stormpathApiKeyFile'))) {
      app.get('stormpathLogger').error('API key file (' + app.get('stormpathApiKeyFile') + ') doesn\'t exist.');
      throw new Error('ERROR: API key file (' + app.get('stormpathApiKeyFile') + ') doesn\'t exist.');
    }
  }

  if (!(
    (app.get('stormpathApiKeyId') && app.get('stormpathApiKeySecret')) ||
    app.get('stormpathApiKeyFile')
  )) {
    app.get('stormpathLogger').error('No Stormpath credentials specified.');
    throw new Error('ERROR: No Stormpath credentials specified.');
  }
};
