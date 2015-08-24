'use strict';

var async = require('async');
var Cookies = require('cookies');
var jade = require('jade');
var mixin = require('utils-merge');
var parseIsoDuration = require('parse-iso-duration');
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

var viewCache = {};

function renderJade(filepath,locals){
  var env = process.env.NODE_ENV;
  if( env ==='production' ){
    if(!viewCache[filepath]){
      viewCache[filepath] = jade.compileFile(filepath);
    }
    return viewCache[filepath](locals);
  }else{
    return jade.renderFile(filepath,locals);
  }
}

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
module.exports.render = function(req, res, view, options) {
  var config = req.app.get('stormpathConfig');
  options = options || {};
  mixin(options, res.locals);
  mixin(options, config.templateContext || {});

  var extension = path.extname(view);

  var filename = path.basename(view, extension);

  if(!extension && (filename === view)){
    /*
      This means that we have received a default config
      option, such as 'login' - just continue to render
      our default page
     */
    res.send(renderJade(path.join(__dirname,'views',view+'.jade'),options));
  }else if(extension === '.jade'){
    // render it as jade
    res.send(renderJade(view,options));
  }else if(extension){
    // delegate to the view engine
    res.render(filename,options);
  }else{
    throw new Error('Unexpected view option: "' + view + '".  Please see documentation for express-stormpath');
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
  var expand = app.get('stormpathConfig').expand || {};
  var logger = app.get('stormpathLogger');

  // First, we need to expand our user attributes, this ensures the user is
  // fully expanded for easy developer usage.
  async.parallel([
    function(cb) {
      if (!expand.apiKeys) {
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
      if (!expand.customData) {
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
      if (!expand.directory) {
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
      if (!expand.groups) {
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
      if (!expand.groupMemberships) {
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
      if (!expand.providerData) {
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
      if (!expand.tenant) {
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
      res.locals.error = error;
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
  var accessTokenCookieConfig = req.app.get('stormpathConfig').web.accessTokenCookie;
  var refreshTokenCookieConfig = req.app.get('stormpathConfig').web.refreshTokenCookie;
  var cookies = new Cookies(req, res);

  res.locals.user = account;
  req.user = account;

  cookies.set(accessTokenCookieConfig.name, passwordGrantAuthenticationResult.accessToken, {
    secure: (accessTokenCookieConfig.https !== null ? accessTokenCookieConfig.https : (req.protocol === 'https')),
    domain: accessTokenCookieConfig.domain,
    expires: new Date(passwordGrantAuthenticationResult.accessToken.body.exp * 1000),
    path: accessTokenCookieConfig.path,
    httpOnly: accessTokenCookieConfig.httpOnly
  });

  cookies.set(refreshTokenCookieConfig.name, passwordGrantAuthenticationResult.refreshToken, {
    secure: (refreshTokenCookieConfig.https !== null ? refreshTokenCookieConfig.https : (req.protocol === 'https')),
    domain: refreshTokenCookieConfig.domain,
    expires: new Date(passwordGrantAuthenticationResult.refreshToken.body.exp * 1000),
    path: refreshTokenCookieConfig.path,
    httpOnly: refreshTokenCookieConfig.httpOnly
  });

};
module.exports.createIdSiteSession = function(account,req,res){
  res.locals.user = account;
  req.user = account;
  var config = req.app.get('stormpathConfig');
  /*
    for this temporary id site session workaround, we will use
    the refresh token expiration as the max age of the session
   */
  var refreshTokenCookieConfig = config.web.refreshTokenCookie;
  var oAuthPolicy = config.application.oAuthPolicy;
  var cookies = new Cookies(req, res);
  cookies.set('idSiteSession', account.href, {
    secure: (refreshTokenCookieConfig.https !== null ? refreshTokenCookieConfig.https : (req.protocol === 'https')),
    domain: refreshTokenCookieConfig.domain,
    expires: new Date(new Date().getTime() + parseIsoDuration(oAuthPolicy.refreshTokenTtl)),
    path: refreshTokenCookieConfig.path,
    httpOnly: refreshTokenCookieConfig.httpOnly
  });
};

module.exports.loginResponder = function(passwordGrantAuthenticationResult,account,req,res){
  var accepts = req.accepts(['html','json']);
  var config = req.app.get('stormpathConfig');
  var postLoginHandler = config.postLoginHandler;
  var redirectUrl = config.web.login.nextUri;
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
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');


  // In the event this has already been run (this can happen due to Express
  // routing logic) -- don't re-run this function.
  if (req.user) {
    next();
  }else if(req.cookies && req.cookies.idSiteSession){
    var accountHref = req.cookies.idSiteSession;
    client.getAccount(accountHref,function(err,account){
      if(err){
        logger.info('Failed to get account from idSiteSession cookie');
        next();
      }else if(account.status!=='ENABLED'){
        logger.info('Account for idSiteSession cookie is not ENALBED');
        next();
      }else{
        req.user = account;
        res.locals.user = account;
        next();
      }
    });

  }else if(req.cookies){
    var authenticator = new stormpath.JwtAuthenticator(application);
    authenticator.authenticate(req,function(err,authenticationResult){
      if(err){
        logger.info('Failed to authenticate the request.');

        if(req.cookies && req.cookies.refresh_token){
          new stormpath.OAuthRefreshTokenGrantRequestAuthenticator(application)
            .authenticate({
              refresh_token: req.cookies.refresh_token
            },function(err,refreshGrantResponse){
              if(err){
                logger.info('Failed to refresh an access token.');
                next();
              }else{
                refreshGrantResponse.getAccount(function(err,account){
                  if(err){
                    logger.info('Failed to get account from refreshGrantResponse');
                  }else{
                    module.exports.createSession(refreshGrantResponse,account,req,res);
                  }
                  next();
                });
              }
            });
        }else{
          next();
        }

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
  }else{
    next();
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

/**
 * @private
 * @callback getRequiredRegistrationFieldsCallback
 * @param {Array} fields - An array of required field names (as strings). Might
 *  be empty if the user explicitly disables all fields in the configuration.
 */

/**
 * Gets a list of required registration fields.
 *
 * @param {Object} config - The Stormpath Configuration object.
 * @param {getRequiredRegistrationFieldsCallback} callback - The callback to
 *  run.
 */
module.exports.getRequiredRegistrationFields = function(config, callback) {
  var fields = [];

  if (!config || !config.web || !config.web.register) {
    return callback([]);
  }

  async.forEachOf(config.web.register.fields || {}, function(field, fieldName, cb) {
    if (field && field.required) {
      fields.push(field.name);
    }

    cb();
  }, function() {
    callback(fields);
  });
};

/**
 * @private
 * @callback validateAccountCallback
 * @param {Error[]} errors - An array of Account validation errors (if there
 *  are any).  Will be null if no errors are present and the Account is valid.
 */

/**
 * Validate that all required Account data is present and valid before
 * attempting to create an Account on Stormpath.  If any required fields are
 * missing or invalid, an array of errors will be returned.
 *
 * @param {Object} account - The user supplied account data.
 * @param {Object} stormpathConfig - The Stormpath configuration object.
 * @param {validateAccountCallback} callback - The callback to run.
 */
module.exports.validateAccount = function(accountData, stormpathConfig, callback) {
  var accountFields = Object.keys(accountData);
  var errors = [];

  module.exports.getRequiredRegistrationFields(stormpathConfig, function(requiredFields) {
    async.each(requiredFields, function(field, cb) {
      if (accountFields.indexOf(field) <= -1 || (accountFields.indexOf(field) > -1 && !accountData[field])) {
        errors.push(new Error(field + ' required.'));
      }

      cb();
    }, function() {
      return errors.length ? callback(errors) : callback(null);
    });
  });
};
