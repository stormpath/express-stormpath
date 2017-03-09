'use strict';

const jwkToPem = require('jwk-to-pem');
const nJwt = require('njwt');
const requestExecutor = require('./request-executor');

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
class AccessTokenAuthenticator {

  constructor() {
    this.localValidation = false;
  }

  withLocalValidation() {
    this.localValidation = true;
    return this;
  }

  forIssuer(issuer) {
    this.expectedIssuer = issuer;
    return this;
  }

  forOrg(org) {
    this.org = org;
    return this;
  }

  withClientId(clientId) {
    this.clientId = clientId;
  }

  authenticate(jwtAccessTokenString, callback) {
    var self = this;

    const verifier = nJwt.createVerifier()
      .withKeyResolver(this.jwksResolver.bind(this))
      .setSigningAlgorithm('RS256');

    verifier.verify(jwtAccessTokenString, function (err, jwt) {
      if (err) {
        return callback(err);
      }

      if (self.localValidation) {
        return callback(err, jwt);
      }

    });
  }

  jwksResolver(kid, callback) {
    const req = {
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

      const matches = res.keys.filter((key) => key.kid === kid);

      if (matches.length === 0) {
        return callback('Unresolved signing key');
      }

      callback(null, jwkToPem(matches[0]));

    });
  }
}
module.exports = AccessTokenAuthenticator;
