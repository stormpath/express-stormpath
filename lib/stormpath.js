'use strict';


var async = require('async');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var express = require('express');
var expressVersion = require('express/package.json').version;
var session = require('client-sessions');
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
        throw new Error("ERROR: Couldn't find Stormpath application.");
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
  var apiRouter = express.Router();
  var webRouter = express.Router();
  opts = opts || {};

  async.series([
    helpers.initSettings(app, opts),
    helpers.checkSettings(app),
    initClient(app),
    initApplication(app),
  ]);

  // Initialize session middleware.
  webRouter.use(session({
    cookieName: 'stormpathSession',
    requestKey: 'session',
    secret: app.get('stormpathSecretKey'),
    duration: app.get('stormpathSessionDuration'),
    cookie: {
      httpOnly: true,
      secure: app.get('stormpathEnableHttps'),
    }
  }));

  // Parse the request body.
  apiRouter.use(bodyParser.urlencoded({
    extended: true,
  }));
  webRouter.use(bodyParser.urlencoded({
    extended: true,
  }));

  // Initialize CSRF middleware.
  webRouter.use(csrf());

  // Build routes.
  if (app.get('stormpathEnableRegistration')) {
    webRouter.get(app.get('stormpathRegistrationUrl'), controllers.register);
    webRouter.post(app.get('stormpathRegistrationUrl'), controllers.register);
  }

  if (app.get('stormpathEnableLogin')) {
    webRouter.get(app.get('stormpathLoginUrl'), controllers.login);
    webRouter.post(app.get('stormpathLoginUrl'), controllers.login);
  }

  if (app.get('stormpathEnableLogout')) {
    webRouter.get(app.get('stormpathLogoutUrl'), controllers.logout);
  }

  if (app.get('stormpathEnableForgotPassword')) {
    webRouter.get(app.get('stormpathForgotPasswordChangeUrl'), controllers.forgotChange);
    webRouter.post(app.get('stormpathForgotPasswordChangeUrl'), controllers.forgotChange);
    webRouter.get(app.get('stormpathForgotPasswordUrl'), controllers.forgot);
    webRouter.post(app.get('stormpathForgotPasswordUrl'), controllers.forgot);
  }

  if (app.get('stormpathEnableAccountVerification')) {
    webRouter.get(app.get('stormpathAccountVerificationCompleteUrl'), controllers.verificationComplete);
  }

  apiRouter.post(app.get('stormpathGetOauthTokenUrl'), controllers.getToken);

  app.use('/', webRouter);
  app.use('/', apiRouter);

  return function(req, res, next) {
    async.series([
      function(callback) {
        helpers.getUser(req, res, callback);
      }
    ], function() {
      //if (req.url.indexOf(req.app.get('stormpathRegistrationUrl')) === 0 && req.app.get('stormpathEnableRegistration')) {
      //  controllers.register(req, res);
      //} else if (req.url.indexOf(req.app.get('stormpathLoginUrl')) === 0 && req.app.get('stormpathEnableLogin')) {
      //  controllers.login(req, res);
      //} else if (req.url.indexOf(req.app.get('stormpathLogoutUrl')) === 0 && req.app.get('stormpathEnableLogout')) {
      //  controllers.logout(req, res);
      //} else if (req.url.indexOf(req.app.get('stormpathForgotPasswordChangeUrl')) === 0 && req.app.get('stormpathEnableForgotPassword')) {
      //  controllers.forgotChange(req, res);
      //} else if (req.url.indexOf(req.app.get('stormpathForgotPasswordUrl')) === 0 && req.app.get('stormpathEnableForgotPassword')) {
      //  controllers.forgot(req, res);
      //} else if (req.url.indexOf(req.app.get('stormpathAccountVerificationCompleteUrl')) === 0 && req.app.get('stormpathEnableAccountVerification')) {
      //  controllers.verificationComplete(req, res);
      //} else if (req.method === 'POST' && req.url.indexOf(req.app.get('stormpathGetOauthTokenUrl')) === 0) {
      //  controllers.getToken(req, res);
      //} else {
      next();
    });
  };
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
