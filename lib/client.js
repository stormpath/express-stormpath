'use strict';

var async = require('async');
var path = require('path');
var stormpath = require('stormpath');
var stormpathConfig = require('stormpath-config');
var uuid = require('uuid');
var configStrategy = stormpathConfig.strategy;

function DefaultJwksCacheManager(defaultJwksCacheManagerConfig) {
  defaultJwksCacheManagerConfig = defaultJwksCacheManagerConfig || {};
  this.ttl = defaultJwksCacheManagerConfig.ttl;
  this.jwks = null;
}
DefaultJwksCacheManager.prototype.getJwks = function getJwks() {
  var now = new Date().getTime();
  if (now > (this.lastSet + this.ttl)) {
    this.jwks = null;
  }

  return this.jwks;
};
DefaultJwksCacheManager.prototype.setJwks = function setJwks(jwks) {
  this.lastSet = new Date().getTime();
  this.jwks = jwks;
};


// Factory method to create a client using a configuration only.
// The configuration provided to this factory is the final configuration.
function ClientFactory(config) {
  return new stormpath.Client(
    new stormpathConfig.Loader([
      new configStrategy.ExtendConfigStrategy(config)
    ])
  );
}
/**
 * Fetches authorization server and client configuration from Okta, requires
 * an already defined okta.org and okta.applicationId
 */
function OktaConfigurationStrategy() {

}
OktaConfigurationStrategy.prototype.process = function process(config, callback) {
  var client = new ClientFactory(config);
  var applicationCredentialsResourceUrl = '/internal/apps/' + config.application.id + '/settings/clientcreds';

  async.parallel({
    applicationResource: client.getApplication.bind(client, '/apps/' + config.application.id),
    applicationCredentialsResource: client.getResource.bind(client, applicationCredentialsResourceUrl),
    idps: client.getResource.bind(client, '/idps')
  }, function (err, results) {

    if (err) {
      return callback(err);
    }

    /**
     * Copy the authorization server ID to it's new location on the applicatin's profile object.
     */

    var authServerIdAtOldLocation = results.applicationResource.settings.notifications.vpn.message;
    var authServerIdAtNewLocation = results.applicationResource.profile && results.applicationResource.profile.forAuthorizationServerId;

    config.authorizationServerId = authServerIdAtNewLocation || authServerIdAtOldLocation;

    if (!authServerIdAtNewLocation) {
      if (!results.applicationResource.profile) {
        results.applicationResource.profile = {};
      }
      results.applicationResource.profile.forAuthorizationServerId = authServerIdAtOldLocation;
      results.applicationResource.save(function (err) {
        if (err) {
          console.error(err); // eslint-disable-line no-console
        }
        console.log('Persisted authorization server ID to new location on application.settings'); // eslint-disable-line no-console
      });
    }

    config.authorizationServerClientId = results.applicationCredentialsResource.client_id;
    config.authorizationServerClientSecret = results.applicationCredentialsResource.client_secret;

    var idps = results.idps.items.filter(function (idp) {
      return ['LINKEDIN', 'FACEBOOK', 'GOOGLE'].indexOf(idp.type) > -1;
    });

    var idpConfiguration = idps.reduce(function (idpConfiguration, idp) {
      var providerId = idp.type.toLowerCase();
      var providedConfig = config.web.social[providerId] || {};

      var clientId = idp.protocol.credentials.client.client_id;

      var redirectUri = '/callbacks/' + providerId;

      var scope = providedConfig.scope || idp.protocol.scopes.join(' ');

      var authorizeUriParams = {
        client_id: config.authorizationServerClientId,
        idp: idp.id,
        response_type: 'code',
        response_mode: 'query',
        scope: scope,
        redirect_uri: '{redirectUri}', // Leave this here for now, will be replaced when a view is requested
        nonce: uuid.v4(),
        state: '{state}' // Leave this here for now, will be replaced when a view is requested
      };

      var authorizeUri = config.org + 'oauth2/' + config.authorizationServerId + '/v1/authorize?';

      authorizeUri += Object.keys(authorizeUriParams).reduce(function (queryString, param) {
        return queryString += '&' + param + '=' + authorizeUriParams[param];
      }, '');

      idpConfiguration[providerId] = {
        clientId: clientId,
        clientSecret: idp.protocol.credentials.client.client_secret,
        enabled: idp.status === 'ACTIVE',
        providerId: providerId,
        providerType: providerId,
        scope: scope,
        uri: redirectUri, // for back compat if custom templates are dep
        redirectUri: redirectUri,
        authorizeUri: authorizeUri
      };

      return idpConfiguration;
    }, {});

    config.web.social = idpConfiguration;

    if (config.web.refreshTokenCookie.maxAge) {
      config.web.refreshTokenCookie.maxAge = parseInt(config.web.refreshTokenCookie.maxAge, 10);
    }

    config.jwksCacheManager = config.jwksCacheManager || new DefaultJwksCacheManager(config.web.defaultJwksCacheManagerConfig);

    callback(null, config);

  });
};

module.exports = function (config) {
  var configLoader = stormpath.configLoader(config);

  // Load our integration config.
  configLoader.prepend(new configStrategy.LoadFileConfigStrategy(path.join(__dirname, '/config.yml'), true));
  configLoader.add(new OktaConfigurationStrategy(ClientFactory));

  return new stormpath.Client(configLoader);
};
