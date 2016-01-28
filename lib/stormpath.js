'use strict';

var cookieParser = require('cookie-parser');
var express = require('express');
var winston = require('winston');

var controllers = require('./controllers');
var helpers = require('./helpers');
var middleware = require('./middleware');
var version = require('../package.json').version;
var bodyParser = helpers.bodyParser;

var expressVersion = helpers.getAppModuleVersion('express') || 'unknown';

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

    function addSpaRoute(path) {
      router.get(path, function (req, res) {
        res.sendFile(web.spaRoot);
      });
    }

    function addGetRoute(path, controller) {
      router.get(path, bodyParser.forceDefaultBody(), controller);
    }

    function addPostRoute(path, controller, options) {
      router.post(path, bodyParser.formOrJson(options), controller);
    }

    router.use(localsMiddleware);
    router.use(cookieParser());

    addGetRoute('/spa-config', controllers.socialProviders);

    if (web.idSite.enabled) {
      addGetRoute(web.idSite.uri, controllers.idSiteVerify);
    }

    if (web.register.enabled) {
      if (web.idSite.enabled) {
        addGetRoute(web.register.uri, controllers.idSiteRedirect({ path: web.idSite.registerUri }));
      } else {
        if (web.spaRoot) {
          addSpaRoute(web.register.uri);
        } else {
          addGetRoute(web.register.uri, controllers.register);
        }
        addPostRoute(web.register.uri, controllers.register, { limit: '11mb' });
      }
    }

    if (web.login.enabled) {
      if (web.idSite.enabled) {
        addGetRoute(web.login.uri, controllers.idSiteRedirect({ path: web.idSite.loginUri }));
      } else {
        router.use(web.login.uri, stormpathMiddleware);
        if (web.spaRoot) {
          addSpaRoute(web.login.uri);
        } else {
          addGetRoute(web.login.uri, controllers.login);
        }
        addPostRoute(web.login.uri, controllers.login);
      }
    }

    // Iterate all social providers and set-up controller routes for them.
    for (var providerName in config.socialProviders) {
      var provider = config.socialProviders[providerName];

      if (provider.enabled) {
        var controllerName = providerName + 'Login';
        if (controllerName in controllers) {
          addGetRoute(provider.callbackUri, controllers[controllerName]);
        }
      }
    }

    if (web.logout.enabled) {
      addGetRoute(web.logout.uri, controllers.logout);
    }

    if (web.forgotPassword.enabled) {
      if (web.idSite.enabled) {
        addGetRoute(web.forgotPassword.uri, controllers.idSiteRedirect({ path: web.idSite.forgotUri }));
      } else {
        addGetRoute(web.forgotPassword.uri, controllers.forgotPassword);
        addPostRoute(web.forgotPassword.uri, controllers.forgotPassword);
      }
    }

    if (web.changePassword.enabled) {
      if (web.spaRoot) {
        addSpaRoute(web.changePassword.uri);
      } else {
        addGetRoute(web.changePassword.uri, controllers.changePassword);
      }

      addPostRoute(web.changePassword.uri, controllers.changePassword);
    }

    if (web.verifyEmail.enabled) {
      addGetRoute(web.verifyEmail.uri, controllers.verifyEmail);
      addPostRoute(web.verifyEmail.uri, controllers.verifyEmail);
    }

    if (web.spaRoot || web.me.enabled) {
      router.get(web.me.uri, stormpathMiddleware, middleware.loginRequired, function (req, res) {
        res.json(req.user);
      });
    }

    if (web.oauth2.enabled) {
      router.all(web.oauth2.uri, bodyParser.form(), stormpathMiddleware, controllers.getToken);
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
