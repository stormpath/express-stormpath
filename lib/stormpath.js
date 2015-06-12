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
var settings = require('./settings');
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
  return function(next) {
    var userAgent = 'stormpath-express/' + version + ' ' + 'express/' + expressVersion;
    opts.userAgent = userAgent;
    var client = new stormpath.Client(opts);

    app.set('stormpathClient', client);
    app.set('jwsClaimsParser', nJwt.Parser().setSigningKey(opts.client.apiKey.secret));
    next();
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
    initClient(app, opts),
    initApplication(app, opts),
  ]);

  // Parse the request body.
  router.use(bodyParser.urlencoded({ extended: true }));

  //if (opts.web.angularPath) {
  //  app.use(express.static(opts.web.angularPath));
  //}

  function serveAngular(path){
    router.get(path,function(req, res) {
      res.sendfile(opts.web.angularPath + '/index.html');
    });
  }

  // Use a special session key for our session management so as to NOT conflict
  // with any user session stuff (which is usually mapped to req.session).
  //var csrfMiddleware = csrf({ cookie: !!opts.web.angularPath });

  // Build routes.
  router.use(appMiddleware);

  if (opts.web.idSite.enabled) {
    router.get(opts.web.idSite.uri, controllers.idSiteVerify);
  }

  if (opts.web.register.enabled) {
    if (opts.web.idSite.enabled) {
      router.get(opts.web.register.uri, controllers.idSiteRegister);
    } else {
      router.use(opts.web.register.uri, urlMiddleware);
      if (opts.web.angularPath) {
        serveAngular(opts.web.register.uri);
      } else{
        router.get(opts.web.register.uri, controllers.register);
      }
      router.post(opts.web.register.uri, bodyParser.json({ limit: '11mb' }), controllers.register);
    }
  }

  if (app.get('stormpathEnableLogin')) {
    if (app.get('stormpathEnableIdSite')) {
      router.get(app.get('stormpathLoginUrl'), controllers.idSiteLogin);
    } else {
      router.use(app.get('stormpathLoginUrl'), urlMiddleware, stormpathMiddleware);
      if (opts.web.angularPath){
        serveAngular(app.get('stormpathLoginUrl'));
      } else {
        router.get(app.get('stormpathLoginUrl'), controllers.login);
      }
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

    router.use(app.get('stormpathForgotPasswordUrl'), csrfMiddleware);
    router.use(app.get('stormpathForgotPasswordChangeUrl'), csrfMiddleware);

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
    router.use(app.get('stormpathResendAccountVerificationEmailUrl'), csrfMiddleware);
    router.get(app.get('stormpathResendAccountVerificationEmailUrl'), controllers.resendAccountVerificationEmail);
    router.post(app.get('stormpathResendAccountVerificationEmailUrl'), controllers.resendAccountVerificationEmail);
  }

  router.get('/me',stormpathMiddleware,authentication.loginRequired,function(req,res){
    res.json(req.user);
  });

  router.post(app.get('stormpathGetOauthTokenUrl'), stormpathMiddleware, controllers.getToken);
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
