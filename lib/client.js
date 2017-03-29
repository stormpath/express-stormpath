'use strict';

var async = require('async');
var path = require('path');
var stormpath = require('stormpath');
var stormpathConfig = require('stormpath-config');
var configStrategy = stormpathConfig.strategy;

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
    applicationCredentialsResource: client.getResource.bind(client, applicationCredentialsResourceUrl)
  }, function (err, results) {

    if (err) {
      return callback(err);
    }

    config.authorizationServerId = results.applicationResource.settings.notifications.vpn.message;
    config.authorizationServerClientId = results.applicationCredentialsResource.client_id;
    config.authorizationServerClientSecret = results.applicationCredentialsResource.client_secret;

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
