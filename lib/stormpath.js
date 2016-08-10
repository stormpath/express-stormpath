'use strict';

var cookieParser = require('cookie-parser');
var express = require('express');
var winston = require('winston');

var controllers = require('./controllers');
var helpers = require('./helpers');
var middleware = require('./middleware');
var bodyParser = helpers.bodyParser;

var version = require('../package.json').version;
var expressVersion = helpers.getAppModuleVersion('express') || 'unknown';
var userAgent = 'stormpath-express/' + version + ' ' + 'express/' + expressVersion;

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
  opts.userAgent = userAgent;

  var logger = opts.logger;

  if (!logger) {
    logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
          level: opts.debug || 'error'
        })
      ]
    });
  }

  app.set('stormpathLogger', logger);

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

  // Handle the X-Stormpath-Agent header.
  // Important: This might not report 100% accurately since the
  // user agent might be overwritten by a subsequent request with a
  // different header (race condition). But this is "good enough" for
  // now until we've solved this issue in the Node SDK (since creating
  // new clients for each request is too expensive it would be
  // better if we could just scope it).
  function stormpathUserAgentMiddleware(req, res, next) {
    var newUserAgent = userAgent;
    var config = req.app.get('stormpathConfig');
    var stormpathAgent = req.headers['x-stormpath-agent'];

    if (stormpathAgent) {
      newUserAgent = stormpathAgent + ' ' + userAgent;
    }

    config.userAgent = newUserAgent;

    next();
  }

  function awaitClientReadyMiddleware(req, res, next) {
    if (isClientReady) {
      next();
    } else {
      app.on('stormpath.ready', function () {
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
      res.locals.url = req.protocol + '://' + helpers.getHost(req);

      // Make the app object available for access in all templates.
      res.locals.app = req.app;
      res.locals.stormpathConfig = config;

      next();
    }

    function addGetRoute(path, controller) {
      router.get(path, bodyParser.forceDefaultBody(), controller);
    }

    function addPostRoute(path, controller, options) {
      router.post(path, bodyParser.formOrJson(options), controller);
    }

    router.use(localsMiddleware);
    router.use(cookieParser());

    if (web.idSite.enabled) {
      addGetRoute(web.idSite.uri, controllers.idSiteVerify);
    }

    if (web.register.enabled) {
      if (web.idSite.enabled) {
        addGetRoute(web.register.uri, controllers.idSiteRedirect({ path: web.idSite.registerUri }));
      } else {
        addGetRoute(web.register.uri, controllers.register);
        addPostRoute(web.register.uri, controllers.register, { limit: '11mb' });
      }
    }

    if (web.login.enabled) {
      if (web.idSite.enabled) {
        addGetRoute(web.login.uri, controllers.idSiteRedirect({ path: web.idSite.loginUri }));
      } else {
        router.use(web.login.uri, helpers.getUser);
        addGetRoute(web.login.uri, controllers.login);
        addPostRoute(web.login.uri, controllers.login);
      }
    }

    // Iterate all social providers and set-up controller routes for them.
    for (var providerName in config.web.social) {
      var provider = config.web.social[providerName];

      if (provider.enabled) {
        var controllerName = providerName + 'Login';
        if (controllerName in controllers) {
          addGetRoute(provider.uri, controllers[controllerName]);
        }
      }
    }

    if (web.logout.enabled) {
      addPostRoute(web.logout.uri, controllers.logout);
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
      addGetRoute(web.changePassword.uri, controllers.changePassword);
      addPostRoute(web.changePassword.uri, controllers.changePassword);
    }

    if (web.verifyEmail.enabled) {
      addGetRoute(web.verifyEmail.uri, controllers.verifyEmail);
      addPostRoute(web.verifyEmail.uri, controllers.verifyEmail);
    }

    if (web.me.enabled) {
      router.get(web.me.uri, stormpathMiddleware, middleware.loginRequired, controllers.currentUser);
    }

    if (web.oauth2.enabled) {
      router.all(web.oauth2.uri, bodyParser.form(), stormpathMiddleware, controllers.getToken);
    }

    client.getApplication(config.application.href, function (err, application) {
      if (err) {
        throw new Error('Cannot fetch application ' + config.application.href);
      }

      // Warm the view model cache
      helpers.getFormViewModel('login', config, function () {});
      helpers.getFormViewModel('register', config, function () {});

      app.set('stormpathApplication', application);
      isClientReady = true;
      app.emit('stormpath.ready');
    });
  });

  router.use(stormpathUserAgentMiddleware);

  app.use(awaitClientReadyMiddleware);

  return router;
};

function getUserMiddlewareProxy(nextMiddleware) {
  return function (req, res, next) {
    helpers.getUser(req, res, nextMiddleware.bind(null, req, res, next));
  };
}

/**
 * Expose the `loginRequired` middleware.
 *
 * @property loginRequired
 */
module.exports.loginRequired = getUserMiddlewareProxy(middleware.loginRequired);

/**
 * Expose the `getUser` middleware.
 *
 * @property getUser
 */
module.exports.getUser = helpers.getUser;

/**
 * Expose the `groupsRequired` middleware.
 *
 * @property groupsRequired
 */
module.exports.groupsRequired = function groupsRequiredProxy() {
  return getUserMiddlewareProxy(middleware.groupsRequired.apply(null, arguments));
};

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
module.exports.authenticationRequired = getUserMiddlewareProxy(middleware.authenticationRequired);
