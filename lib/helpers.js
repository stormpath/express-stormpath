var jade = require('jade');
var mixin = require('utils-merge');
var stormpath = require('stormpath');


module.exports.title = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};


module.exports.render = function(view, res, options) {
  options = options || {};
  mixin(options, res.locals);

  jade.renderFile(view, options, function(err, html) {
    if (err) throw err;
    res.send(html);
  });
};


module.exports.getUser = function(req, res, callback) {
  if (req.session && req.session.user) {
    req.app.get('stormpathClient').getAccount(req.session.user.href, { expand: 'customData,groups' }, function(err, account) {
      if (err) {
        req.session.reset();
      } else {
        req.session.user = account;
        res.locals.user = account;
      }
      callback();
    });
  } else {
    callback();
  }
};


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
    app.set('stormpathSessionDuration', opts.sessionDuration || parseInt(process.env.STORMPATH_SESSION_DURATION) || 1000 * 60 * 60 * 24 * 30);

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

    // Which views should we render?
    app.set('stormpathRegistrationView', opts.registrationView || process.env.STORMPATH_REGISTRATION_VIEW || __dirname + '/views/register.jade');
    app.set('stormpathLoginView', opts.loginView || process.env.STORMPATH_LOGIN_VIEW || __dirname + '/views/login.jade');

    // Routing configuration.
    app.set('stormpathRegistrationUrl', opts.registrationUrl || process.env.STORMPATH_REGISTRATION_URL || '/register');
    app.set('stormpathLoginUrl', opts.loginUrl || process.env.STORMPATH_LOGIN_URL || '/login');
    app.set('stormpathLogoutUrl', opts.logoutUrl || process.env.STORMPATH_LOGOUT_URL || '/logout');
    app.set('stormpathRedirectUrl', opts.redirectUrl || process.env.STORMPATH_REDIRECT_URL || '/');

    next();
  };
};


module.exports.checkSettings = function(app) {
  return function(next) {
    if (!app.get('stormpathSecretKey')) {
      throw new Error('ERROR: No Stormpath secretKey specified.');
    }

    if (!(
      (app.get('stormpathApiKeyID') && app.get('stormpathApiKeySecret')) ||
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
