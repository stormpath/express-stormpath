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
module.exports = function (req, res, next) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  var accessTokenCookieName = config.web.accessTokenCookie.name;
  var refreshTokenCookieName = config.web.refreshTokenCookie.name;

  // In the event this has already been run (this can happen due to Express
  // routing logic) -- don't re-run this function.
  if (req.user) {
    return next();
  }

  var cookies = req.cookies;

  if (cookies && cookies[accessTokenCookieName]) {
    var authenticator = new stormpath.JwtAuthenticator(application);

    if (config.web.oauth2.password.validationStrategy === 'local') {
      authenticator.withLocalValidation();
    }

    authenticator.authenticate(cookies[accessTokenCookieName], function (err, authenticationResult) {
      if (err) {
        logger.info('Failed to authenticate the request. Invalid access_token found.');

        if (!cookies[refreshTokenCookieName]) {
          return next();
        }

        return new stormpath.OAuthRefreshTokenGrantRequestAuthenticator(application).authenticate({ refresh_token: cookies[refreshTokenCookieName] }, function (err, refreshGrantResponse) {
          if (err) {
            logger.info('Failed to refresh an access_token given a refresh_token.');
            return next();
          }

          refreshGrantResponse.getAccount(function (err, account) {
            if (err) {
              logger.info('Failed to get account from refreshGrantResponse.');
              return next();
            }

            if (account.status !== 'ENABLED') {
              logger.info('Account for refresh_token cookie is not ENALBED.');
              return next();
            }

            expandAccount(account, config.expand, logger, function (err, expandedAccount) {
              if (err) {
                logger.info('Failed to expand the user\'s account.');
                return next();
              }

              res.locals.user = expandedAccount;
              req.user = expandedAccount;

              if (refreshGrantResponse.grantedScopes) {
                res.locals.permissions = refreshGrantResponse.grantedScopes;
                req.user = expandedAccount;
                req.permissions = refreshGrantResponse.grantedScopes;
              }

              createSession(refreshGrantResponse, account, req, res);
              next();
            });
          });
        });
      }

      req.accessToken = authenticationResult.accessToken;
      authenticationResult.getAccount(function (err, account) {
        if (err) {
          logger.info('Failed to get account ' + authenticationResult.account.href);
          return next();
        }

        if (account.status !== 'ENABLED') {
          logger.info('Account for access_token cookie is not ENALBED.');
          return next();
        }

        expandAccount(account, config.expand, logger, function (err, expandedAccount) {
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
  } else if (cookies && cookies[refreshTokenCookieName]) {
    new stormpath.OAuthRefreshTokenGrantRequestAuthenticator(application).authenticate({ refresh_token: cookies[refreshTokenCookieName] }, function (err, refreshGrantResponse) {
      if (err) {
        logger.info('Failed to refresh an access_token given a refresh_token.');
        return next();
      }

      refreshGrantResponse.getAccount(function (err, account) {
        if (err) {
          logger.info('Failed to get account from refreshGrantResponse.');
          return next();
        }

        if (account.status !== 'ENABLED') {
          logger.info('Account for refresh_token cookie is not ENALBED.');
          return next();
        }

        expandAccount(account, config.expand, logger, function (err, expandedAccount) {
          if (err) {
            logger.info('Failed to expand the user\'s account.');
            return next();
          }

          res.locals.user = expandedAccount;
          req.user = expandedAccount;

          if (refreshGrantResponse.grantedScopes) {
            res.locals.permissions = refreshGrantResponse.grantedScopes;
            req.user = expandedAccount;
            req.permissions = refreshGrantResponse.grantedScopes;
          }

          createSession(refreshGrantResponse, account, req, res);
          next();
        });
      });
    });
  } else {
    application.authenticateApiRequest({ request: req }, function (err, result) {
      if (err) {
        logger.info('Failed to authenticate the incoming request.');
        return next();
      }

      result.getAccount(function (err, account) {
        if (err) {
          logger.info('Failed to get account.');
          return next();
        }

        if (account.status !== 'ENABLED') {
          logger.info('Account is not ENALBED.');
          return next();
        }

        expandAccount(account, config.expand, logger, function (err, expandedAccount) {
          if (err) {
            logger.info('Failed to expand the user\'s account.');
            return next();
          }

          res.locals.user = expandedAccount;
          req.user = expandedAccount;

          next();
        });
      });
    });
  }
};
