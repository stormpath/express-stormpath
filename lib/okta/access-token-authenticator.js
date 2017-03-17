'use strict';

var jwkToPem = require('jwk-to-pem');
var nJwt = require('njwt');
var requestExecutor = require('./request-executor');
var StormpathAccessTokenAuthenticationResult = require('stormpath/lib/oauth/stormpath-access-token-authentication-result');

/**
 * @class
 *
 * @constructor
 *
 * @description
 *
 * Creates an authenticator that can be used to validate access tokens that have
 * been issued by an Okta Authorization Sever
 *
 * @returns {Jwt}
 */

function AccessTokenAuthenticator(client) {
  if (!(this instanceof AccessTokenAuthenticator)) {
    return new AccessTokenAuthenticator();
  }
  this.client = client;
  this.localValidation = false;
}

AccessTokenAuthenticator.prototype.withLocalValidation = function withLocalValidation() {
  this.localValidation = true;
  return this;
};

AccessTokenAuthenticator.prototype.forIssuer = function forIssuer(issuer) {
  this.expectedIssuer = issuer;
  return this;
};

AccessTokenAuthenticator.prototype.forOrg = function forOrg(org) {
  this.org = org;
  return this;
};

AccessTokenAuthenticator.prototype.withClientId = function withClientId(clientId) {
  this.clientId = clientId;
  return this;
};

AccessTokenAuthenticator.prototype.authenticate = function authenticate(jwtAccessTokenString, callback) {
  var self = this;

  var verifier = nJwt.createVerifier()
    .withKeyResolver(this.jwksResolver.bind(this))
    .setSigningAlgorithm('RS256');

  verifier.verify(jwtAccessTokenString, function (err, jwt) {
    if (err) {
      return callback(err);
    }

    if (self.localValidation) {
      return callback(err, new StormpathAccessTokenAuthenticationResult(self.client, {
        jwt: jwtAccessTokenString,
        expandedJwt: jwt,
        account: {
          href: 'users/' + jwt.body.uid
        }
      }));
    }

  });
};

AccessTokenAuthenticator.prototype.jwksResolver = function jwksResolver(kid, callback) {
  var req = {
    url: this.expectedIssuer + '/v1/keys',
    json: true
  };
  requestExecutor(req, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (!res.keys || !res.keys.length) {
      return callback('Keys collection not found');
    }

    var matches = res.keys.filter((key) => key.kid === kid);

    if (matches.length === 0) {
      return callback('Unresolved signing key');
    }

    callback(null, jwkToPem(matches[0]));

  });
};

module.exports = AccessTokenAuthenticator;
