'use strict';

var stormpath = require('stormpath');

var createSession = require('./create-session');
var expandAccount = require('./expand-account');

/**
 * This callback, when called, will simply continue processing the HTTP
 * request.
 *
 * @callback nextCallback
 * @private
 */

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
module.exports = function(req, res, next) {
  var application = req.app.get('stormpathApplication');
  var client = req.app.get('stormpathClient');
  var logger = req.app.get('stormpathLogger');

  // In the event this has already been run (this can happen due to Express
  // routing logic) -- don't re-run this function.
  if (req.user) {
    return next();
  }

  if (req.cookies && req.cookies.idSiteSession) {
    var accountHref = req.cookies.idSiteSession;

    client.getAccount(accountHref, function(err, account) {
      if (err) {
        logger.info('Failed to get account from idSiteSession cookie.');
        return next();
      }

      if (account.status !== 'ENABLED') {
        logger.info('Account for idSiteSession cookie is not ENALBED.');
        return next();
      }

      req.user = account;
      res.locals.user = account;
      next();
    });
  } else if (req.cookies) {
    var authenticator = new stormpath.JwtAuthenticator(application);

    authenticator.authenticate(req, function(err, authenticationResult) {
      if (err) {
        logger.info('Failed to authenticate the request.');

        if (!(req.cookies && req.cookies.refresh_token)) {
          return next();
        }

        return new stormpath.OAuthRefreshTokenGrantRequestAuthenticator(application).authenticate({ refresh_token: req.cookies.refresh_token }, function(err, refreshGrantResponse) {
          if (err) {
            logger.info('Failed to refresh an access token.');
            return next();
          }

          refreshGrantResponse.getAccount(function(err, account) {
            if (err) {
              logger.info('Failed to get account from refreshGrantResponse.');
            } else {
              createSession(refreshGrantResponse, account, req, res);
            }

            next();
          });
        });
      }

      req.accessToken = authenticationResult.accessToken;
      authenticationResult.getAccount(function(err, account) {
        if (err) {
          logger.info('Failed to get account ' + authenticationResult.account.href);
          return next();
        }

        module.exports.expandAccount(req.app, account, function(err, expandedAccount) {
          if (err) {
            logger.info('Failed to expand the user\'s account.');
            return next();
          }

          res.locals.user = expandedAccount;
          req.user = expandedAccount;

          if (authenticationResult.grantedScopes) {
            res.locals.permissions = authenticationResult.grantedScopes;
            req.user = expandedAccount;
            req.permissions = authenticationResult.grantedScopes;
          }

          next();
        });
      });
    });
  } else {
    next();
  }
};
