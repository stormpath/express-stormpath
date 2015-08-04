'use strict';

var async = require('async');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var express = require('express');
var expressVersion = require('express/package.json').version;
var stormpath = require('stormpath');
var controllers = require('./controllers');
var nJwt = require('nJwt');

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
          level: opts.debug ? 'info' : 'error',
        })
      ]
    }));
  }

  client.on('ready',function(){
    app.set('stormpathConfig',client.config);
    app.set('stormpathClient', client);
    app.set('jwsClaimsParser', nJwt.Parser().setSigningKey(client.config.apiKey.secret));

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

    function localsMiddleware(req,res,next){
      // helper for getting the current URL
      res.locals.url = req.protocol + '://' + req.get('host');
      // Make the app object available for access in all templates.
      res.locals.app = req.app;
      res.locals.config = config;
      next();
    }

    function serveAngular(path){
      router.get(path,function(req, res) {
        res.sendfile(config.web.angularPath + '/index.html');
      });
    }

    router.use(localsMiddleware);

    if (config.web.idSite.enabled) {
      router.get(config.web.idSite.uri, controllers.idSiteVerify);
    }

    if (config.web.register.enabled) {
      if (config.web.idSite.enabled) {
        router.get(config.web.register.uri, controllers.idSiteRegister);
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
        router.get(config.web.login.uri, controllers.idSiteLogin);
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

    if (app.get('stormpathEnableGoogle')) {
      router.use(app.get('stormpathGoogleLoginUrl'));
      router.get(app.get('stormpathGoogleLoginUrl'), controllers.googleLogin);
    }

    if (app.get('stormpathEnableFacebook')) {
      router.use(app.get('stormpathFacebookLoginUrl'));
      router.get(app.get('stormpathFacebookLoginUrl'), controllers.facebookLogin);
    }

    if (config.web.logout.enabled) {

      router.get(config.web.logout.uri, controllers.logout);
    }

    if (config.web.forgotPassword.enabled) {

      router.get(config.web.forgotPassword.uri, controllers.forgot);
      router.post(config.web.forgotPassword.uri, controllers.forgot);
    }

    if (config.web.changePassword.enabled) {

      router.get(config.web.changePassword.uri, controllers.forgotChange);
      router.post(config.web.changePassword.uri, controllers.forgotChange);
    }

    if (config.web.verifyEmail.enabled) {

      router.get(config.web.verifyEmail.nextUri, controllers.verifyEmail);
      router.get(config.web.verifyEmail.uri, controllers.resendAccountVerificationEmail);
      router.post(config.web.verifyEmail.uri, controllers.resendAccountVerificationEmail);
    }

    if(config.web.angularPath){
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
