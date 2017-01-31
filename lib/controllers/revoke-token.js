'use strict';

var middleware = require('../middleware');
var nJwt = require('njwt');

/**
 * Revokes an OAuth token (an access token or a refresh token). When an access
 * token is revoked, the associated access token is revoked as well.
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
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  var token = req.body.token;
  var jwtSigningKey = config.client.apiKey.secret;

  function writeErrorResponse(err) {
    var error = {
      error: err.error,
      message: err.userMessage || err.message
    };

    logger.info('An OAuth token revoke failed due to an improperly formed request.');

    return res.status(err.status || err.statusCode || 400).json(error);
  }

  /**
   * @private
   *
   * Given a token's resource ID and its type (access or refresh),
   * retrieves a token with that ID if and only if it is one of the tokens
   * belonging to this user. If there is no such token, the callback is called
   * with no data nonetheless, due to how RFC 7009 defines this case.
   *
   * @param {String} tokenId Token resource identifier
   * @param {String} tokenType The type of the token, `access` or `refresh`
   * @param {Function} callback Function to be called after completion
   */
  function loadTokenForUser(tokenId, tokenType, callback) {
    var getTokens;
    switch (tokenType) {
      case 'access':
        getTokens = req.user.getAccessTokens.bind(req.user);
        break;
      case 'refresh':
        getTokens = req.user.getRefreshTokens.bind(req.user);
        break;
      default:
        return writeErrorResponse({
          error: 'unsupported_token_type'
        });
    }

    getTokens(function (err, collection) {
      if (err) {
        return callback(err);
      }

      var validTokens = collection.items.filter(function (token) {
        return token.href.indexOf(tokenId) !== -1;
      });

      if (validTokens.length) {
        return callback(null, validTokens[0]);
      }

      // RFC 7009 states that if there is no token, it counts as already invalidated,
      // and the process should proceed as it were found and invalidated.
      callback();
    });

  }

  /**
   * @private
   *
   * Unpacks a token from its compact form and retrieves the correct token resource
   * belonging to the current user from that data, if there is one such token.
   *
   * @param {String} compactToken Token in compact string form
   * @param {Function} callback Function to be called after completion
   */
  function getTokenResource(compactToken, callback) {
    nJwt.verify(compactToken, jwtSigningKey, function (err, parsedToken) {
      if (err) {
        return callback(err);
      }

      var tokenType = parsedToken.header.stt;
      var tokenId = parsedToken.body.jti;

      loadTokenForUser(tokenId, tokenType, callback);
    });
  }

  middleware.apiAuthenticationRequired(req, res, function (err) {
    if (err) {
      return writeErrorResponse(err);
    }

    if (!token) {
      return writeErrorResponse({
        error: 'invalid_request'
      });
    }

    getTokenResource(token, function (err, resource) {
      if (err) {
        return writeErrorResponse(err);
      }

      if (!resource) {
        return res.status(200).end();
      }

      resource.delete(function (err) {
        if (err) {
          return writeErrorResponse(err);
        }

        res.status(200).end();
      });
    });
  });
};