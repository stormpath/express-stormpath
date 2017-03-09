'use strict';

var njwt = require('njwt');
var requestExecutor = require('../okta/request-executor');

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
function revokeToken(config, token, tokenType, callback) {
  callback = callback || function () {};

  var req = {
    url: config.okta.org + 'oauth2/' + config.okta.authorizationServerId + '/v1/revoke',
    method: 'POST',
    form: {
      token: tokenType,
      token_type_hint: tokenType,
      client_id: config.okta.authorizationServerClientId
    }
  };

  requestExecutor(req, callback);
}

module.exports = {
  revokeAccessToken: function (config, token, callback) {
    revokeToken(config, token, 'access_token', callback);
  },
  revokeRefreshToken: function (config, token, callback) {
    revokeToken(config, token, 'refresh_token', callback);
  }
};