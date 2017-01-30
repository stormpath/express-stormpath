'use strict';

var middleware = require('../middleware');
var nJwt = require('njwt');

module.exports = function (req, res) {
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var token = req.body.token;
  var jwtSigningKey = config.client.apiKey.secret;
  var isPostRequest = req.method === 'POST';
  var logger = req.app.get('stormpathLogger');

  function writeErrorResponse(err) {
    var error = {
      error: err.error,
      message: err.userMessage || err.message
    };

    logger.info('An OAuth token revoke failed due to an improperly formed request.');

    return res.status(err.status || err.statusCode || 400).json(error);
  }

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
          error: 'invalid_request'
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

      callback();
    });

  }

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

  if (!isPostRequest) {
    return res.status(405).end();
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

      // TODO delete related
      resource.delete(function (err) {
        if (err) {
          return writeErrorResponse(err);
        }

        res.status(200).end();
      });
    });
  });
};