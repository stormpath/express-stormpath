'use strict';

var stormpath = require('stormpath');

var createSession = require('../helpers/create-session');
var expandAccount = require('../helpers/expand-account');

const AccessTokenAuthenticator = require('../okta/access-token-authenticator');

const getAppUserById = require('../okta/get-app-user-by-id');

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


  // In the event this has already been run (this can happen due to Express
  // routing logic) -- don't re-run this function.
  if (req.user) {
    return next();
  }

  var issuer = config.okta.org + '/oauth2/' + config.okta.authorizationServerId;

  var accessTokenAuthenticator = new AccessTokenAuthenticator().forIssuer(issuer);

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
  var resolvedAccessToken = accessTokenFromHeader || accessTokenFromCookie;

  if (resolvedAccessToken) {
    accessTokenAuthenticator.authenticate(resolvedAccessToken, function (err, jwt) {
      if (err) {

        req.authenticationError = err;

        logger.info(err);

        if (!refreshTokenFromCookie) {
          return next();
        }

        return new stormpath.OAuthRefreshTokenGrantRequestAuthenticator(application).authenticate({ refresh_token: refreshTokenFromCookie }, function (err, refreshGrantResponse) {
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

      req.authenticationResult = {
        expandedJwt: jwt,
        jwt: resolvedAccessToken
      };

      getAppUserById(config.okta.org, config.okta.appId, config.okta.apiToken, jwt.body.uid, (err, user) => {
        if (err) {
          logger.info(err);
          return next();
        }
        res.locals.user = user;
        req.user = user;
        next();
      });

    });
  } else if (refreshTokenFromCookie) {
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
    // At this point, I believe this is only handling Basic auth requests
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
