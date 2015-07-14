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
  app.set('stormpathConfig',client.config);

  app.set('stormpathClient', client);
  app.set('jwsClaimsParser', nJwt.Parser().setSigningKey(client.config.apiKey.secret));

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
  client.on('ready',app.emit.bind(app,'stormpath.ready'));
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
function initApplication(app, opts) {
  return function(next) {
    async.series([
      // If no application is set, we'll attempt to grab a user-defined
      // application from their Stormpath account.  If more than one app exists,
      // we'll throw an error since we don't know what one to use.
      function(callback) {
        if (!opts.application) {
          app.get('stormpathClient').getApplications(function(err, apps) {
            if (err) {
              app.get('stormpathLogger').info('Failed to retrieve a list of Stormpath applications.');
              next(err);
            } else {
              if (apps.size === 2) {
                apps.each(function(a, cb) {
                  if (a.name !== 'Stormpath') {
                    opts.application = { href: a.href };
                  }
                  cb();
                }, function() {
                  callback();
                });
              } else {
                callback();
              }
            }
          });
        } else {
          callback();
        }
      },

      // If no app can be found, we'll just error out since we already tried
      // everything.
      function(callback) {
        if (!opts.application) {
          app.get('stormpathLogger').error('No Stormpath application specified.');
          throw new Error('ERROR: No Stormpath application specified.');
        }
        callback();
      },

      // If we get here, it means we have may have an app href / name, so we
      // need to actually retrieve the app.
      function(callback) {
        if (!opts.application) {
          return callback();
        }

        // If an href exists, we'll grab the app directly.
        if (opts.application.href) {
          app.get('stormpathClient').getApplication(opts.application.href, function(err, application) {
            if (err) {
              app.get('stormpathLogger').error('Couldn\'t fetch the Stormpath application (' + app.get('stormpathApplication') + ').');
              throw err;
            }
            app.set('stormpathApplication', application);
            opts.application.name = application.name;
            callback();
          });
        } else if (opts.application.name) {
          app.get('stormpathClient').getApplications({ name: opts.application.name }, function(err, application) {
            if (err) {
              app.get('stormpathLogger').error('Couldn\'t fetch the Stormpath application (' + app.get('stormpathApplication') + ').');
              throw err;
            }
            app.set('stormpathApplication', application);
            opts.application.href = application.href;
            callback();
          });
        } else {
          app.get('stormpathLogger').error('No Stormpath application specified.');
          throw new Error('ERROR: No Stormpath application specified.');
        }
      }
    ], function() {
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

  initClient(app, opts);

  var config = app.get('stormpathConfig');

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
    res.locals.config = config;
    next();
  };


  async.series([
    initApplication(app, opts)
  ]);

  // Parse the request body.
  router.use(bodyParser.urlencoded({ extended: true }));

  //if (config.web.angularPath) {
  //  app.use(express.static(config.web.angularPath));
  //}

  function serveAngular(path){
    router.get(path,function(req, res) {
      res.sendfile(config.web.angularPath + '/index.html');
    });
  }

  // Use a special session key for our session management so as to NOT conflict
  // with any user session stuff (which is usually mapped to req.session).
  //var csrfMiddleware = csrf({ cookie: !!config.web.angularPath });

  // Build routes.
  router.use(appMiddleware);

  if (config.web.idSite.enabled) {
    router.get(config.web.idSite.uri, controllers.idSiteVerify);
  }

  if (config.web.register.enabled) {
    if (config.web.idSite.enabled) {
      router.get(config.web.register.uri, controllers.idSiteRegister);
    } else {
      router.use(config.web.register.uri, urlMiddleware);
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
      router.use(config.web.login.uri, urlMiddleware, stormpathMiddleware);
      if (config.web.angularPath){
        serveAngular(config.web.login.uri);
      } else {
        router.get(config.web.login.uri, controllers.login);
      }
      router.post(config.web.login.uri, bodyParser.json({ limit: '200kb' }), controllers.login);
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

  if (config.web.logout.enabled) {
    router.use(config.web.logout.uri, urlMiddleware);
    router.get(config.web.logout.uri, controllers.logout);
  }

  if (config.web.forgotPassword.enabled) {
    router.use(config.web.forgotPassword.uri, urlMiddleware);
    router.get(config.web.forgotPassword.uri, controllers.forgot);
    router.post(config.web.forgotPassword.uri, controllers.forgot);
  }

  if (config.web.changePassword.enabled) {
    router.use(config.web.changePassword.uri, urlMiddleware);
    router.get(config.web.changePassword.uri, controllers.forgotChange);
    router.post(config.web.changePassword.uri, controllers.forgotChange);
  }

  if (config.web.verifyEmail.enabled) {
    router.use(config.web.verifyEmail.nextUri, urlMiddleware);
    router.get(config.web.verifyEmail.nextUri, controllers.verificationComplete);
    router.get(config.web.verifyEmail.uri, controllers.resendAccountVerificationEmail);
    router.post(config.web.verifyEmail.uri, controllers.resendAccountVerificationEmail);
  }

  if(config.web.angularPath){
    router.get(config.web.me.uri,stormpathMiddleware,authentication.loginRequired,function(req,res){
      res.json(req.user);
    });
  }

  router.post(config.web.oauth2.uri, stormpathMiddleware, controllers.getToken);
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
