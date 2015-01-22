'use strict';

var async = require('async');
var jade = require('jade');
var mixin = require('utils-merge');
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
 * Render a Jade view using app locals.
 *
 * This is necessary because our library can't rely on the developer using Jade
 * view as well -- so this allows us to use Jade templates for our library
 * views, without negatively affecting the developer's application.
 *
 * @method
 * @private
 *
 * @param {String} view - The filename to the Jade view to render.
 * @param {Object} res - The http response.
 * @param {Object} options - The locals which will be supplied to the view
 *   during rendering.
 */
module.exports.render = function(view, res, options) {
  options = options || {};
  mixin(options, res.locals);
  mixin(options, res.app.get('stormpathTemplateContext'));

  jade.renderFile(view, options, function(err, html) {
    if (err) {
      res.app.get('stormpathLogger').error('Couldn\'t render view (' + view + ') with options (' + options + ').');
      throw err;
    }

    res.send(html);
  });
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
function expandAccount(app, account, accountCallback) {

  // First, we need to expand our user attributes, this ensures the user is
  // fully expanded for easy developer usage.
  async.parallel([
    function(cb) {
      if (!app.get('stormpathExpandApiKeys')) {
        return cb();
      }

      account.getApiKeys(function(err, apiKeys) {
        if (err) {
          app.get('stormpathLogger').info('Couldn\'t expand ' + account.email + '\'s api keys.');
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
          app.get('stormpathLogger').info('Couldn\'t expand ' + account.email + '\'s custom data.');
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
          app.get('stormpathLogger').info('Couldn\'t expand ' + account.email + '\'s directory.');
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
          app.get('stormpathLogger').info('Couldn\'t expand ' + account.email + '\'s groups.');
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
          app.get('stormpathLogger').info('Couldn\'t expand ' + account.email + '\'s group memberships.');
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
          app.get('stormpathLogger').info('Couldn\'t expand ' + account.email + '\'s provider data.');
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
          app.get('stormpathLogger').info('Couldn\'t expand ' + account.email + '\'s tenant.');
          return accountCallback(err);
        }

        account.tenant = tenant;
        cb();
      });
    }
  ], function(err, results) {
    if (err) {
      app.get('stormpathLogger').info(err);
    }

    accountCallback(null, account);
  });
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

  // In the event this has already been run (this can happen due to Express
  // routing logic) -- don't re-run this function.
  if (req.user) {
    next();
  }

  // If there is session data, we'll fetch the user from Stormpath.
  if (req.session && req.session.user) {
    req.app.get('stormpathClient').getAccount(req.session.user, function(err, account) {
      if (err) {
        req.app.get('stormpathLogger').info('Failed to retrieve the user\'s account.');
        req.session.destroy();
        return next();
      }

      expandAccount(req.app, account, function(err, expandedAccount) {
        if (err) {
          req.app.get('stormpathLogger').info('Failed to expand the user\'s account.');
          return next();
        }

        req.session.user = expandedAccount.href;
        res.locals.user = expandedAccount;
        req.user = expandedAccount;

        next();
      });
    });

  // Here we'll check to see whether or not there is an HTTP Authorization
  // header set.  If so, this means the user is trying to identify via API
  // authentication.
  } else if (req.headers.authorization) {
    req.app.get('stormpathApplication').authenticateApiRequest({ request: req }, function(err, authResult) {
      if (err) {
        req.app.get('stormpathLogger').info('Attempted to authenticate a user via the HTTP authorization header, but invalid credentials were supplied.');
        next();
      } else {
        authResult.getAccount(function(err, account) {
          if (err) {
            req.app.get('stormpathLogger').info('Attempted to retrieve a user\'s account, but this operation failed.');
            return next();
          }

          expandAccount(req.app, account, function(err, expandedAccount) {
            if (err) {
              req.app.get('stormpathLogger').info('Attempted to expand a user\'s account, but this operation failed.');
              return next();
            }

            res.locals.user = expandedAccount;
            res.locals.permissions = authResult.grantedScopes;
            req.user = expandedAccount;
            req.permissions = authResult.grantedScopes;

            next();
          });
        });
      }
    });

  // Otherwise, there is no user information, so simply continue processing
  // without setting the user.
  } else {
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
