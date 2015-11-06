'use strict';

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var expressVersion = require('express/package.json').version;
var winston = require('winston');

var controllers = require('./controllers');
var helpers = require('./helpers');
var middleware = require('./middleware');
var version = require('../package.json').version;

/**
 * Initialize the Stormpath client.
 *
 * @method
 * @private
 *
 * @param {Object} app - The express application.
 * @param {object} opts - A JSON hash of user supplied options.
 *
 * @return {Function} A function which accepts a callback.
 */
function initClient(app, opts) {
  var userAgent = 'stormpath-express/' + version + ' ' + 'express/' + expressVersion;
  opts.userAgent = userAgent;

  var logger = app.get('stormpathLogger');

  if (!logger) {
    logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
          level: opts.debug ? 'info' : 'error'
        })
      ]
    });
    app.set('stormpathLogger', logger);
  }

  var client = require('./client')(opts);

  client.on('error', function (err) {
    logger.error(err);
    app.emit('stormpath.error', err);
  });

  client.on('ready', function () {
    app.set('stormpathClient', client);
    app.set('stormpathConfig', client.config);
  });

  return client;
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
module.exports.init = function (app, opts) {
  opts = opts || {};

  var router = express.Router();
  var client = initClient(app, opts);

  // Parse the request body.
  router.use(bodyParser.urlencoded({ extended: true }));

  // Indicates whether or not the client is ready.
  var isClientReady = false;

  function awaitClientReadyMiddleware(req, res, next) {
    if (isClientReady) {
      next();
    } else {
      client.on('ready', function () {
        isClientReady = true;
        next();
      });
    }
  }

  function stormpathMiddleware(req, res, next) {
    helpers.getUser(req, res, next);
  }

  // Build routes.
  client.on('ready', function () {
    var config = app.get('stormpathConfig');
    var web = config.web;

    // Expand customData by default, unless explicitly disabled.
    if (config.expand && config.expand.customData !== false) {
      config.expand.customData = true;
    }

    function localsMiddleware(req, res, next) {
      // Helper for getting the current URL.
      res.locals.url = req.protocol + '://' + req.get('host');

      // Make the app object available for access in all templates.
      res.locals.app = req.app;
      res.locals.stormpathConfig = config;

      next();
    }

    function serveAngular(path) {
      router.get(path, function (req, res) {
        res.sendfile(web.angularPath + '/index.html');
      });
    }

    router.use(localsMiddleware);
    router.use(cookieParser());

    router.get('/spa-config', controllers.socialProviders);

    if (web.idSite.enabled) {
      router.get(web.idSite.uri, controllers.idSiteVerify);
    }

    if (web.register.enabled) {
      if (web.idSite.enabled) {
        router.get(web.register.uri, controllers.idSiteRedirect({ path: web.idSite.registerUri }));
      } else {
        if (web.angularPath) {
          serveAngular(web.register.uri);
        } else {
          router.get(web.register.uri, controllers.register);
        }
        router.post(web.register.uri, bodyParser.json({ limit: '11mb' }), controllers.register);
      }
    }

    if (web.login.enabled) {
      if (web.idSite.enabled) {
        router.get(web.login.uri, controllers.idSiteRedirect({ path: web.idSite.loginUri }));
      } else {
        router.use(web.login.uri, stormpathMiddleware);
        if (web.angularPath) {
          serveAngular(web.login.uri);
        } else {
          router.get(web.login.uri, controllers.login);
        }
        router.post(web.login.uri, bodyParser.json({ limit: '200kb' }), controllers.login);
      }
    }

    // Iterate all social providers and set-up controller routes for them.
    for (var providerName in config.socialProviders) {
      var provider = config.socialProviders[providerName];

      if (provider.enabled) {
        var controllerName = providerName + 'Login';
        if (controllerName in controllers) {
          router.get(provider.callbackUri, controllers[controllerName]);
        }
      }
    }

    if (web.logout.enabled) {
      router.get(web.logout.uri, controllers.logout);
    }

    if (web.forgotPassword.enabled) {
      if (web.idSite.enabled) {
        router.get(web.forgotPassword.uri, controllers.idSiteRedirect({ path: web.idSite.forgotUri }));
      } else {
        router.get(web.forgotPassword.uri, controllers.forgotPassword);
        router.post(web.forgotPassword.uri, bodyParser.json({ limit: '200kb' }), controllers.forgotPassword);
      }
    }

    if (web.changePassword.enabled) {
      router.get(web.changePassword.uri, controllers.changePassword);
      router.post(web.changePassword.uri, bodyParser.json({ limit: '200kb' }), bodyParser.urlencoded({ extended: false }), controllers.changePassword);
    }

    if (web.verifyEmail.enabled) {
      router.get(web.verifyEmail.uri, controllers.verifyEmail);
      router.post(web.verifyEmail.uri, bodyParser.json({ limit: '200kb' }), bodyParser.urlencoded({ extended: false }), controllers.verifyEmail);
    }

    if (web.angularPath || web.me.enabled) {
      router.get(web.me.uri, stormpathMiddleware, middleware.loginRequired, function (req, res) {
        res.json(req.user);
      });
    }

    if (web.oauth2.enabled) {
      router.all(web.oauth2.uri, stormpathMiddleware, controllers.getToken);
    }

    client.getApplication(config.application.href, function (err, application) {
      if (err) {
        throw new Error('Cannot fetch application ' + config.application.href);
      }

      app.set('stormpathApplication', application);
      app.emit('stormpath.ready');
    });
  });

  app.use(awaitClientReadyMiddleware);
  app.use('/', router);
  app.use(stormpathMiddleware);

  return stormpathMiddleware;
};

/**
 * Expose the `loginRequired` middleware.
 *
 * @property loginRequired
 */
module.exports.loginRequired = middleware.loginRequired;

/**
 * Expose the `groupsRequired` middleware.
 *
 * @property groupsRequired
 */
module.exports.groupsRequired = middleware.groupsRequired;

/**
 * Expose the `apiAuthenticationRequired` middleware.
 *
 * @property apiAuthenticationRequired
 */
module.exports.apiAuthenticationRequired = middleware.apiAuthenticationRequired;

/**
 * Expose the `authenticationRequired` middleware.
 *
 * @property authenticationRequired
 */
module.exports.authenticationRequired = middleware.authenticationRequired;
