'use strict';

var async = require('async');
var bodyParser = require('body-parser');
var express = require('express');
var expressVersion = require('express/package.json').version;
var stormpath = require('stormpath');
var controllers = require('./controllers');
var cookieParser = require('cookie-parser');

var authentication = require('./authentication');
var helpers = require('./helpers');
var winston = require('winston');
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
  var client = new stormpath.Client(opts);

  if (!app.get('stormpathLogger')) {
    app.set('stormpathLogger', new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
          level: opts.debug ? 'info' : 'error'
        })
      ]
    }));
  }

  client.on('ready', function() {
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
module.exports.init = function(app, opts) {
  var router = express.Router();
  opts = opts || {};

  var client = initClient(app, opts);



  var stormpathMiddleware = function(req, res, next) {
    async.series([
      function(callback) {
        helpers.getUser(req, res, callback);
      }
    ], function() {
      next();
    });
  };




  // Parse the request body.
  router.use(bodyParser.urlencoded({ extended: true }));

  //if (config.web.angularPath) {
  //  app.use(express.static(config.web.angularPath));
  //}



  // Use a special session key for our session management so as to NOT conflict
  // with any user session stuff (which is usually mapped to req.session).
  //var csrfMiddleware = csrf({ cookie: !!config.web.angularPath });

  // Build routes.
  client.on('ready',function() {

    var config = app.get('stormpathConfig');

    // expand customData by default, unless explicitly enabled

    if(config.expand && config.expand.customData!==false){
      config.expand.customData = true;
    }

    function localsMiddleware(req,res,next){
      // helper for getting the current URL
      res.locals.url = req.protocol + '://' + req.get('host');
      // Make the app object available for access in all templates.
      res.locals.app = req.app;
      res.locals.stormpathConfig = config;
      next();
    }

    function serveAngular(path){
      router.get(path,function(req, res) {
        res.sendfile(config.web.angularPath + '/index.html');
      });
    }

    router.use(localsMiddleware);

    router.use(cookieParser());

    if (config.web.idSite.enabled) {
      router.get(config.web.idSite.uri, controllers.idSiteVerify);
    }

    if (config.web.register.enabled) {
      if (config.web.idSite.enabled) {
        router.get(config.web.register.uri, controllers.idSiteRedirect({path:config.web.idSite.registerUri}));
      } else {

        if (config.web.angularPath) {
          serveAngular(config.web.register.uri);
        } else{
          router.get(config.web.register.uri, controllers.register);
        }
        router.post(config.web.register.uri, bodyParser.json({ limit: '11mb' }), controllers.register);
      }
    }

    if (config.web.login.enabled) {
      if (config.web.idSite.enabled) {
        router.get(config.web.login.uri, controllers.idSiteRedirect({path:config.web.idSite.loginUri}));
      } else {
        router.use(config.web.login.uri, stormpathMiddleware);
        if (config.web.angularPath){
          serveAngular(config.web.login.uri);
        } else {
          router.get(config.web.login.uri, controllers.login);
        }
        router.post(config.web.login.uri, bodyParser.json({ limit: '200kb' }), controllers.login);
      }
    }

    // TODO: clean this up...
    if (config.socialProviders.facebook.enabled) {
      router.get(config.socialProviders.facebook.callbackUri, controllers.facebookLogin);
    }
    if (config.socialProviders.google.enabled) {
     router.get(config.socialProviders.google.callbackUri, controllers.googleLogin);
    }

    if (config.web.logout.enabled) {
      router.get(config.web.logout.uri, controllers.logout);
    }

    if (config.web.forgotPassword.enabled) {
      if (config.web.idSite.enabled) {
        router.get(config.web.forgotPassword.uri, controllers.idSiteRedirect({path:config.web.idSite.forgotUri}));
      } else {
        router.get(config.web.forgotPassword.uri, controllers.forgotPassword);
        router.post(config.web.forgotPassword.uri, controllers.forgotPassword);
      }
    }

    if (config.web.changePassword.enabled) {
      router.get(config.web.changePassword.uri, controllers.changePassword);
      router.post(config.web.changePassword.uri, bodyParser.json({ limit: '200kb' }), bodyParser.urlencoded({ extended: false }), controllers.changePassword);
    }

    if (config.web.verifyEmail.enabled) {
      router.get(config.web.verifyEmail.uri, controllers.verifyEmail);
      router.post(config.web.verifyEmail.uri, bodyParser.json({ limit: '200kb' }), bodyParser.urlencoded({ extended: false }), controllers.verifyEmail);
    }

    if(config.web.angularPath || config.web.me.enabled){
      router.get(config.web.me.uri,stormpathMiddleware,authentication.loginRequired,function(req,res){
        res.json(req.user);
      });
    }

    router.post(config.web.oauth2.uri, stormpathMiddleware, controllers.getToken);
    client.getApplication(config.application.href,function(err,application){
      if(err){
        throw new Error('Cannot fetch application ' + config.application.href);
      }else{
        app.set('stormpathApplication',application);
        app.emit('stormpath.ready');
      }
    });

  });

  app.use('/', router);
  app.use(stormpathMiddleware);
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

/**
 * Expose the `authenticationRequired` middleware.
 *
 * @property authenticationRequired
 */
module.exports.authenticationRequired = authentication.authenticationRequired;
