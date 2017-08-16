'use strict';

var util = require('util');

var createSession = require('../helpers/create-session');
var expandAccount = require('../helpers/expand-account');

var AccessTokenAuthenticator = require('../okta/access-token-authenticator');
var oktaOAuthRequest = require('../okta/oauth-request');

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
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');


  // In the event this has already been run (this can happen due to Express
  // routing logic) -- don't re-run this function.
  if (req.user) {
    return next();
  }

  var issuer = config.org + '/oauth2/' + config.authorizationServerId;

  var accessTokenAuthenticator = new AccessTokenAuthenticator(client).forIssuer(issuer);

  if (config.web.oauth2.password.validationStrategy === 'local') {
    accessTokenAuthenticator.withLocalValidation();
  }

  var cookies = req.cookies;

  var accessTokenCookieName = config.web.accessTokenCookie.name;
  var accessTokenFromCookie = cookies && cookies[accessTokenCookieName];

  var refreshTokenCookieName = config.web.refreshTokenCookie.name;
  var refreshTokenFromCookie = cookies && cookies[refreshTokenCookieName];

  var authorizationHeader = req.headers.Authorization || req.headers.authorization || '';
  var accessTokenFromHeader = authorizationHeader.match(/Bearer [^;]+/) ? authorizationHeader.split('Bearer ')[1] : null;
  var resolvedAccessToken;

  config.web.getUser.accessTokenSearchLocations.forEach(function (location) {
    if (resolvedAccessToken) {
      return;
    }
    switch (location) {
      case 'header':
        resolvedAccessToken = accessTokenFromHeader;
        break;
      case 'cookie':
        resolvedAccessToken = accessTokenFromCookie;
        break;
    }
  });

  if (resolvedAccessToken) {
    accessTokenAuthenticator.authenticate(resolvedAccessToken, function (err, authenticationResult) {
      if (err) {

        req.authenticationError = err;

        logger.info(err);

        if (!refreshTokenFromCookie) {
          return next();
        }

        return oktaOAuthRequest(config, {
          grant_type: 'refresh_token',
          refresh_token: cookies[refreshTokenCookieName]
        }, function (err, refreshGrantResponse) {
          if (err) {
            logger.info('Failed to refresh an access_token given a refresh_token.');
            return next();
          }

          var issuer = config.org + '/oauth2/' + config.authorizationServerId;

          var accessTokenAuthenticator = new AccessTokenAuthenticator(client).forIssuer(issuer).withLocalValidation();

          accessTokenAuthenticator.authenticate(refreshGrantResponse.access_token, function (err, authenticationResult) {

            authenticationResult.getAccount(function (err, account) {
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

                /**
                 * Okta returns the same refresh token in the response.  We want to omit this from
                 * createSession(), otherwse we would continue to extend the expiration of this
                 * cookie, which is not what we want (we went it to expire at the configured maxAge)
                 */

                delete refreshGrantResponse.refresh_token;

                createSession(refreshGrantResponse, account, req, res);
                next();
              });
            });
          });
        });

      }

      req.authenticationResult = authenticationResult;

      // Backcompat: Provide the expanded JWT as req.accessToken,
      // which has the claims under the 'body' key.
      Object.defineProperty(req, 'accessToken', {
        get: util.deprecate(function () {
          return authenticationResult.expandedJwt;
        }, 'req.accessToken is deprecated, use req.authenticationResult instead.')
      });

      authenticationResult.getAccount(function (err, user) {
        if (err) {
          logger.info(err);
          return next();
        }

        expandAccount(user, config.expand, logger, function (err, user) {
          if (err) {
            logger.info('Failed to expand the user\'s account.');
            return next();
          }

          res.locals.user = user;
          req.user = user;
          next();
        });
      });

    });
  } else if (refreshTokenFromCookie) {
    oktaOAuthRequest(config, {
      grant_type: 'refresh_token',
      refresh_token: cookies[refreshTokenCookieName]
    }, function (err, refreshGrantResponse) {
      if (err) {
        logger.info('Failed to refresh an access_token given a refresh_token.');
        return next();
      }

      var issuer = config.org + '/oauth2/' + config.authorizationServerId;

      var accessTokenAuthenticator = new AccessTokenAuthenticator(client).forIssuer(issuer).withLocalValidation();

      accessTokenAuthenticator.authenticate(refreshGrantResponse.access_token, function (err, authenticationResult) {

        authenticationResult.getAccount(function (err, account) {
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

            /**
             * Okta returns the same refresh token in the response.  We want to omit this from
             * createSession(), otherwse we would continue to extend the expiration of this
             * cookie, which is not what we want (we went it to expire at the configured maxAge)
             */

            delete refreshGrantResponse.refresh_token;

            createSession(refreshGrantResponse, account, req, res);
            next();
          });
        });
      });
    });
  } else {
    // TODO - implement a mechanism for handling client credential authentication via basic auth
    next();
  }
};
