'use strict';

var async = require('async');
var Cookies = require('cookies');
var jade = require('jade');
var mixin = require('utils-merge');
var path = require('path');
var stormpath = require('stormpath');

/**
 * This callback, when called, will simply continue processing the HTTP
 * request.
 *
 * @callback nextCallback
 * @private
 */

/**
 * This callback, when called, will pass along a fully expanded Stormpath
 * Account object for future processing.
 *
 * @callback accountCallback
 * @private
 *
 * @param {Object} err - An error (if no account could be retrieved, or one of
 *   the requests failed).
 * @param {Object} account - The fully expanded Stormpath Account object.
 */

/**
 * Titlecase a string.
 *
 * @method
 * @private
 *
 * @param {String} - A string to titlecase.
 *
 * @return {String} A titlecased string.
 */
module.exports.title = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Render a view using app locals.
 *
 * By default, use Jade as it is necessary because our library can't rely
 * on the developer using Jade view as well -- so this allows us to use
 * Jade templates for our library views, without negatively affecting the
 * developer's application.
 *
 * If, however, the developer has supplied a render handler in their settings,
 * then we'll go ahead and use that render function instead.
 *
 * @method
 * @private
 *
 * @param {String} view - The filename to the view to render.
 * @param {Object} res - The http response.
 * @param {Object} options - The locals which will be supplied to the view
 *   during rendering.
 */
module.exports.render = function(view, res, options) {
  options = options || {};
  mixin(options, res.locals);
  mixin(options, res.app.get('stormpathTemplateContext'));

  // undefined
  var renderHandler = res.app.get('stormpathRenderHandler');

  view = path.join(__dirname, 'views', view+'.jade');
  if (renderHandler) {
    renderHandler(view, res, options);
  } else {
    jade.renderFile(view, options, function(err, html) {
      if (err) {
        res.app.get('stormpathLogger').error('Couldn\'t render view (' + view + ') with options (' + options + ').');
        throw err;
      }

      res.send(html);
    });
  }
};

/**
 * Given an Account, we'll automatically expand all of the useful linked fields
 * to make working with the Account object easier.
 *
 * @method
 * @private
 *
 * @param {Object} app - The Express application object.
 * @param {Object} account - The Stormpath Account object to expand.
 * @param {accountCallback} - The callback which is called to continue
 *   processing the request.
 */
module.exports.expandAccount = function(app, account, accountCallback) {
  var logger = app.get('stormpathLogger');

  // First, we need to expand our user attributes, this ensures the user is
  // fully expanded for easy developer usage.
  async.parallel([
    function(cb) {
      if (!app.get('stormpathExpandApiKeys')) {
        return cb();
      }

      account.getApiKeys(function(err, apiKeys) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s api keys.');
          return accountCallback(err);
        }

        account.apiKeys = apiKeys;
        cb();
      });
    },
    function(cb) {
      if (!app.get('stormpathExpandCustomData')) {
        return cb();
      }

      account.getCustomData(function(err, customData) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s custom data.');
          return accountCallback(err);
        }

        account.customData = customData;
        cb();
      });
    },
    function(cb) {
      if (!app.get('stormpathExpandDirectory')) {
        return cb();
      }

      account.getDirectory(function(err, directory) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s directory.');
          return accountCallback(err);
        }

        account.directory = directory;
        cb();
      });
    },
    function(cb) {
      if (!app.get('stormpathExpandGroups')) {
        return cb();
      }

      account.getGroups(function(err, groups) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s groups.');
          return accountCallback(err);
        }

        account.groups = groups;
        cb();
      });
    },
    function(cb) {
      if (!app.get('stormpathExpandGroupMemberships')) {
        return cb();
      }

      account.getGroupMemberships(function(err, groupMemberships) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s group memberships.');
          return accountCallback(err);
        }

        account.groupMemberships = groupMemberships;
        cb();
      });
    },
    function(cb) {
      if (!app.get('stormpathExpandProviderData')) {
        return cb();
      }

      account.getProviderData(function(err, providerData) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s provider data.');
          return accountCallback(err);
        }

        account.providerData = providerData;
        cb();
      });
    },
    function(cb) {
      if (!app.get('stormpathExpandTenant')) {
        return cb();
      }

      account.getTenant(function(err, tenant) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s tenant.');
          return accountCallback(err);
        }

        account.tenant = tenant;
        cb();
      });
    }
  ], function(err) {
    if (err) {
      logger.info(err);
    }

    accountCallback(null, account);
  });
};

module.exports.xsrfValidator = function xsrfValidator(req,res,next){
  var error = 'Invalid XSRF token';
  var token = req.headers['x-xsrf-token'] || (req.body && req.body.xsrfToken) || (req.query && req.query.xsrfToken);

  if(token===req.accessToken.body.xsrfToken){
    next();
  }else{
    if (req.accepts(['html', 'json']) === 'html') {
      var url = req.app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);
      req.locals.error = error;
      res.redirect(302, url);
    } else {
      res.status(401).json({ error: 'Invalid XSRF token' });
    }
  }
};

/**
 * Creates a JWT, stores it in a cookie, and provides it on the request object
 * for other middleware to use.
 *
 * @param  {Object} authenticationResult From the Node SDK.
 * @param  {Object} req                  Express HTTP request.
 * @param  {Object} res                  Express HTTP response.
 */
module.exports.createSession = function(passwordGrantAuthenticationResult,account,req,res){
  var config = req.app.get('stormpathConfig').web.accessTokenCookie;

  var forceHttps = config.https;
  var domain = config.domain;
  var httpOnly = config.httpOnly;
  var path = config.path;

  var cookies = new Cookies(req, res);

  var isSecure = forceHttps !== null ? forceHttps : (req.protocol === 'https');

  res.locals.user = account;
  req.user = account;

  cookies.set('access_token', passwordGrantAuthenticationResult.accessToken, {
    secure: isSecure,
    domain: domain,
    expires: new Date(passwordGrantAuthenticationResult.accessToken.body.exp * 1000),
    path: path,
    httpOnly: httpOnly
  });

  cookies.set('refresh_token', passwordGrantAuthenticationResult.refreshToken, {
    secure: isSecure,
    domain: domain,
    expires: new Date(passwordGrantAuthenticationResult.refreshToken.body.exp * 1000),
    path: path,
    httpOnly: httpOnly
  });

};

module.exports.loginResponder = function(passwordGrantAuthenticationResult,account,req,res){
  var accepts = req.accepts(['html','json']);
  var postLoginHandler = req.app.get('stormpathPostLoginHandler');
  var redirectUrl = req.app.get('stormpathConfig').web.login.nextUri;
  module.exports.createSession(passwordGrantAuthenticationResult,account,req,res);
  if (postLoginHandler) {
    postLoginHandler(req.user, req, res, function() {
      if( accepts === 'json'){
        res.end();
      }else{
        var url = req.query.next || redirectUrl;
        res.redirect(302, url);
      }
    });
  } else {
    if( accepts === 'json'){
      res.end();
    }else{
      var url = req.query.next || redirectUrl;
      res.redirect(302, url);
    }
  }

};

/**
 * Attempts to retrieve a user object from either the session, a user's API
 * keys, or a user's OAuth tokens, making it available in the current context.
 * If a user cannot be found, nothing will be done and the request will
 * continue processing.
 *
 * @method
 * @private
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {nextCallback} next - The callback which is called to continue
 *   processing the request.
 */
module.exports.getUser = function(req, res, next) {
  var application = req.app.get('stormpathApplication');
  var logger = req.app.get('stormpathLogger');


  // In the event this has already been run (this can happen due to Express
  // routing logic) -- don't re-run this function.
  if (req.user) {
    next();
  }else{
    var authenticator = new stormpath.OAuthAuthenticator(application);
    authenticator.authenticate(req,function(err,authenticationResult){
      if(err){
        logger.info('Failed to authenticate the request.');
        next();
      }else{
        req.accessToken = authenticationResult.accessToken;
        authenticationResult.getAccount(function(err,account){
          if(err){
            logger.info('Failed to get account ' + authenticationResult.account.href);
            next();
          }else{
            module.exports.expandAccount(req.app, account, function(err, expandedAccount) {
              if (err) {
                logger.info('Failed to expand the user\'s account.');
                return next();
              }
              res.locals.user = expandedAccount;
              req.user = expandedAccount;
              if(authenticationResult.grantedScopes){
                res.locals.permissions = authenticationResult.grantedScopes;
                req.user = expandedAccount;
                req.permissions = authenticationResult.grantedScopes;
              }
              next();
            });
          }
        });
      }
    });
  }

};

/**
 * Collects errors in a form.
 *
 * @method
 * @private
 *
 * @param  {Object} form - the form to collect errors from.
 * @return {Array} An array of objects that contains the field key and the error message.
 */
module.exports.collectFormErrors = function(form) {
  var errors = [];

  Object.keys(form.fields).forEach(function(key) {
    if (form.fields.hasOwnProperty(key)) {
      var field = form.fields[key];
      var error = field.error;

      if (!!error) {
        errors.push({
          field: key,
          error: error
        });
      }
    }
  });

  return errors;
};
