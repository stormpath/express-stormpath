'use strict';

var stormpath = require('stormpath');
var expandAccount = require('../helpers/expand-account');

/**
 * Allow a developer to exchange their API keys for an OAuth token.
 *
 * The URL this controller is bound to can be controlled via express-stormpath
 * settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var grantType = req.body.grant_type;
  var isPostRequest = req.method === 'POST';
  var logger = req.app.get('stormpathLogger');

  function writeErrorResponse(err) {
    var error = {
      error: err.error,
      message: err.userMessage || err.message
    };

    logger.info('An OAuth token exchange failed due to an improperly formed request.');

    return res.status(err.status || err.statusCode || 400).json(error);
  }

  function writeSuccessResponse(authResult) {
    res.json(authResult.accessTokenResponse);
  }

  function resolveClientCredentialsAuthFields(req) {
    var authHeader = req && req.headers && req.headers.authorization;

    if (authHeader && authHeader.match(/Basic/i)) {
      var authorization = authHeader.split(' ').pop();
      var parts = new Buffer(authorization, 'base64').toString('utf8').split(':');

      req.body.apiKey = {
        id: parts[0],
        secret: parts[1]
      };
    } else if (req.body && req.body.client_id && req.body.client_secret) {
      req.body.apiKey = {
        id: req.body.client_id,
        secret: req.body.client_secret
      };
    }
  }

  function continueWithHandlers(authResult, preHandler, postHandler, onCompleted) {
    var options = req.body || {};

    if (!preHandler) {
      preHandler = function (options, req, res, next) {
        next();
      };
    }

    preHandler(options, req, res, function (err) {
      if (err) {
        return writeErrorResponse(err);
      }

      if (postHandler) {
        return authResult.getAccount(function (err, account) {
          if (err) {
            return writeErrorResponse(err);
          }

          expandAccount(account, config.expand, logger, function (err, expandedAccount) {
            if (err) {
              return writeErrorResponse(err);
            }

            return config.postLoginHandler(expandedAccount, req, res, function (err) {
              if (err) {
                return writeErrorResponse(err);
              }

              onCompleted();
            });
          });
        });
      }

      onCompleted();
    });
  }

  if (!isPostRequest) {
    return res.status(405).end();
  }

  switch (grantType) {
    case undefined:
      writeErrorResponse({
        error: 'invalid_request'
      });
      break;
    case 'password':
    case 'refresh_token':
    case 'client_credentials':
      var authenticator = new stormpath.OAuthAuthenticator(application);

      if (config.web.scopeFactory) {
        authenticator.setScopeFactory(config.web.scopeFactory);
        authenticator.setScopeFactorySigningKey(config.client.apiKey.secret);
      }

      if (grantType === 'client_credentials') {
        resolveClientCredentialsAuthFields(req);
      }

      authenticator.authenticate(req, function (err, authResult) {
        if (err) {
          return writeErrorResponse(err);
        }

        if (grantType === 'password' && (config.preLoginHandler || config.postLoginHandler)) {
          return continueWithHandlers(
            authResult,
            config.preLoginHandler,
            config.postLoginHandler,
            writeSuccessResponse.bind(null, authResult)
          );
        }

        writeSuccessResponse(authResult);
      });
      break;

    default:
      writeErrorResponse({
        error: 'unsupported_grant_type'
      });
      break;
  }
};
