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
    .withKeyResolver(this.jwkResolver.bind(this))
    .setSigningAlgorithm('RS256');

  verifier.verify(jwtAccessTokenString, function (err, jwt) {
    if (err) {
      return callback(err);
    }

    var authenticationResult = new StormpathAccessTokenAuthenticationResult(self.client, {
      jwt: jwtAccessTokenString,
      expandedJwt: jwt,
      account: {
        href: self.client.config.org + 'api/v1/users/' + jwt.body.uid
      }
    });

    if (self.localValidation) {
      return callback(null, authenticationResult);
    } else {
      var req =  {
        url: self.expectedIssuer + '/v1/introspect',
        method: 'POST',
        json: true,
        auth: {
          user: self.client.config.authorizationServerClientId,
          pass: self.client.config.authorizationServerClientSecret
        },
        form: {
          token: jwtAccessTokenString,
          token_type_hint: 'access_token'
        }
      };

      requestExecutor(req, function (err, response) {
        if (err) {
          return callback(err);
        }

        if (response && response.active === true) {
          return callback(null, authenticationResult);
        }

        var newErr = new Error({error: 'Unauthorized'});
        newErr.status = 401;
        return callback(newErr);
      });
    }

  });
};

AccessTokenAuthenticator.prototype.jwksResolver = function jwksResolver(callback) {
  var self = this;
  var cachedJwks = self.client.config.jwksCacheManager.getJwks();
  if (cachedJwks) {
    return callback(null, cachedJwks);
  }
  var req = {
    url: self.expectedIssuer + '/v1/keys',
    json: true
  };
  requestExecutor(req, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (!res.keys || !res.keys.length) {
      return callback('Keys collection not found');
    }
    self.client.config.jwksCacheManager.setJwks(res);
    callback(null, res);
  });
};

AccessTokenAuthenticator.prototype.jwkResolver = function jwkResolver(kid, callback) {
  this.jwksResolver(function (err, jwks) {

    var matches = jwks.keys.filter((key) => key.kid === kid);

    if (matches.length === 0) {
      return callback('Unresolved signing key');
    }

    callback(null, jwkToPem(matches[0]));

  });
};

module.exports = AccessTokenAuthenticator;
