'use strict';


var async = require('async');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var express = require('express');
var expressVersion = require('express/package.json').version;
var stormpath = require('stormpath');
var controllers = require('./controllers');

var authentication = require('./authentication');
var forms = require('./forms');
var helpers = require('./helpers');
var version = require('../package.json').version;


/**
 * Initialize the Stormpath client.
 *
 * @method
 * @private
 *
 * @param {Object} app - The express application.
 *
 * @return {Function} A function which accepts a callback.
 */
function initClient(app) {
  return function(next) {
    var connection;
    var userAgent = 'stormpath-express/' + version + ' ' + 'express/' + expressVersion;

    if (app.get('stormpathCache') === 'memcached') {
      connection = app.get('stormpathCacheHost')  + ':' + app.get('stormpathCachePort');
    }

    var cacheOptions = {
      store: app.get('stormpathCache'),
      connection: connection || {
        host: app.get('stormpathCacheHost'),
        port: app.get('stormpathCachePort'),
      },
      ttl: app.get('stormpathCacheTTL'),
      tti: app.get('stormpathCacheTTI'),
      options: app.get('stormpathCacheOptions'),
    };

    if (app.get('stormpathApiKeyId') && app.get('stormpathApiKeySecret')) {
      app.set('stormpathClient', new stormpath.Client({
        apiKey: new stormpath.ApiKey(
          app.get('stormpathApiKeyId'),
          app.get('stormpathApiKeySecret')
        ),
        cacheOptions: cacheOptions,
        userAgent: userAgent,
      }));
      next();
    } else if (app.get('stormpathApiKeyFile')) {
      stormpath.loadApiKey(app.get('stormpathApiKeyFile'), function(err, apiKey) {
        app.set('stormpathClient', new stormpath.Client({
          apiKey: apiKey,
          cacheOptions: cacheOptions,
          userAgent: userAgent,
        }));
        next();
      });
    }
  };
}


/**
 * Initialize the Stormpath application.
 *
 * @method
 * @private
 *
 * @param {Object} app - The express application.
 *
 * @return {Function} A function which accepts a callback.
 */
function initApplication(app) {
  return function(next) {
    app.get('stormpathClient').getApplication(app.get('stormpathApplication'), function(err, application) {
      if (err) {
        throw err;
      }

      app.set('stormpathApplication', application);
      next();
    });
  };
}


/**
 * Initialize the Stormpath middleware.
 *
 * @method
 *
 * @param {Object} app - The express application.
 * @param {object} opts - A JSON hash of user supplied options.
 *
 * @return {Function} An express middleware.
 */
module.exports.init = function(app, opts) {
  var router = express.Router();
  opts = opts || {};

  var stormpathMiddleware = function(req, res, next) {
    async.series([
      function(callback) {
        helpers.getUser(req, res, callback);
      }
    ], function() {
      next();
    });
  };

  var urlMiddleware = function(req, res, next) {
    res.locals.url = req.protocol + '://' + req.get('host');
    next();
  };

  // Make the app object available for access in all templates.
  var appMiddleware = function(req, res, next) {
    res.locals.app = req.app;
    next();
  };

  async.series([
    helpers.initSettings(app, opts),
    helpers.checkSettings(app),
    initClient(app),
    initApplication(app),
  ]);

  // Parse the request body.
  router.use(bodyParser.urlencoded({ extended: true }));

  // Initialize session middleware.
  // If the application doesn't provide one, we'll use our own.
  var sessionMiddleware = app.get('stormpathSessionMiddleware');

  if (sessionMiddleware) {
    router.use(require('cookie-parser')());
    router.use(sessionMiddleware);
  } else {
    var session = require('client-sessions');

    router.use(session({
      cookieName: 'stormpathSession',
      requestKey: 'session',
      secret: app.get('stormpathSecretKey'),
      duration: app.get('stormpathSessionDuration'),
      cookie: {
        domain: app.get('stormpathSessionDomain'),
        httpOnly: true,
        maxAge: app.get('stormpathSessionDuration'),
        secure: app.get('stormpathEnableHttps'),
      }
    }));
  }

  // Build routes.
  router.use(appMiddleware);
  if (app.get('stormpathEnableIdSite')) {
    router.get(app.get('stormpathIdSiteUrl'), controllers.idSiteVerify);
  }

  if (app.get('stormpathEnableRegistration')) {
    if (app.get('stormpathEnableIdSite')) {
      router.get(app.get('stormpathRegistrationUrl'), controllers.idSiteRegister);
    } else {
      router.use(app.get('stormpathRegistrationUrl'), urlMiddleware);
      router.use(app.get('stormpathRegistrationUrl'), csrf());
      router.get(app.get('stormpathRegistrationUrl'), controllers.register);
      router.post(app.get('stormpathRegistrationUrl'), controllers.register);
    }
  }

  if (app.get('stormpathEnableLogin')) {
    if (app.get('stormpathEnableIdSite')) {
      router.get(app.get('stormpathLoginUrl'), controllers.idSiteLogin);
    } else {
      router.use(app.get('stormpathLoginUrl'), urlMiddleware);
      router.use(app.get('stormpathLoginUrl'), csrf());
      router.get(app.get('stormpathLoginUrl'), controllers.login);
      router.post(app.get('stormpathLoginUrl'), controllers.login);
    }
  }

  if (app.get('stormpathEnableGoogle')) {
    router.use(app.get('stormpathGoogleLoginUrl'), urlMiddleware);
    router.get(app.get('stormpathGoogleLoginUrl'), controllers.googleLogin);
  }

  if (app.get('stormpathEnableFacebook')) {
    router.use(app.get('stormpathFacebookLoginUrl'), urlMiddleware);
    router.get(app.get('stormpathFacebookLoginUrl'), controllers.facebookLogin);
  }

  if (app.get('stormpathEnableLogout')) {
    router.use(app.get('stormpathLogoutUrl'), urlMiddleware);
    router.get(app.get('stormpathLogoutUrl'), controllers.logout);
  }

  if (app.get('stormpathEnableForgotPassword')) {
    router.use(app.get('stormpathForgotPasswordUrl'), urlMiddleware);
    router.use(app.get('stormpathForgotPasswordChangeUrl'), urlMiddleware);
    router.use(app.get('stormpathPostForgotPasswordChangeRedirectUrl'), urlMiddleware);
    router.use(app.get('stormpathPostForgotPasswordRedirectUrl'), urlMiddleware);

    router.use(app.get('stormpathForgotPasswordUrl'), csrf());
    router.use(app.get('stormpathForgotPasswordChangeUrl'), csrf());

    router.get(app.get('stormpathForgotPasswordChangeUrl'), controllers.forgotChange);
    router.post(app.get('stormpathForgotPasswordChangeUrl'), controllers.forgotChange);
    router.get(app.get('stormpathPostForgotPasswordChangeRedirectUrl'), controllers.forgotChangeDone);

    router.get(app.get('stormpathForgotPasswordUrl'), controllers.forgot);
    router.post(app.get('stormpathForgotPasswordUrl'), controllers.forgot);
    router.get(app.get('stormpathPostForgotPasswordRedirectUrl'), controllers.forgotSent);
  }

  if (app.get('stormpathEnableAccountVerification')) {
    router.use(app.get('stormpathAccountVerificationCompleteUrl'), urlMiddleware);
    router.get(app.get('stormpathAccountVerificationCompleteUrl'), controllers.verificationComplete);
  }

  router.post(app.get('stormpathGetOauthTokenUrl'), stormpathMiddleware, controllers.getToken);
  app.use('/', router);
  return stormpathMiddleware;
};


/**
 * Expose the `loginRequired` middleware.
 *
 * @property loginRequired
 */
module.exports.loginRequired = authentication.loginRequired;


/**
 * Expose the `groupsRequired` middleware.
 *
 * @property groupsRequired
 */
module.exports.groupsRequired = authentication.groupsRequired;


/**
 * Expose the `apiAuthenticationRequired` middleware.
 *
 * @property apiAuthenticationRequired
 */
module.exports.apiAuthenticationRequired = authentication.apiAuthenticationRequired;
