'use strict';

var njwt = require('njwt');

/**
 * Revoke a token.
 *
 * @method
 * @private
 *
 * @param {tokenResolverFn} tokenResolver - Function that resolves a token of some kind.
 * @param {string} jwt - Raw JWT.
 * @param {string} jwtSigningKey - Secret used to sign the JWT.
 * @param {callbackFn} callback - Optional callback.
 */
function revokeToken(tokenResolver, jwt, jwtSigningKey, callback) {
  callback = callback || function () {};

  process.nextTick(function () {
    njwt.verify(jwt, jwtSigningKey, function (err, verifiedJwt) {
      if (err) {
        return callback(err);
      }

      tokenResolver(verifiedJwt.body.jti, function (err, token) {
        if (err) {
          return callback(err);
        }

        token.delete(callback);
      });
    });
  });
}

module.exports = {
  revokeAccessToken: function (client, jwt, jwtSigningKey, callback) {
    revokeToken(function (id, onTokenResult) {
      client.getAccessToken('/accessTokens/' + id, onTokenResult);
    }, jwt, jwtSigningKey, callback);
  },
  revokeRefreshToken: function (client, jwt, jwtSigningKey, callback) {
    revokeToken(function (id, onTokenResult) {
      client.getRefreshToken('/refreshTokens/' + id, onTokenResult);
    }, jwt, jwtSigningKey, callback);
  }
};