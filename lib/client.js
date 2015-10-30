'use strict';

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

module.exports = function (config) {
  var configLoader = stormpath.configLoader(config);

  // Load our integration config.
  configLoader.prepend(new configStrategy.LoadFileConfigStrategy(path.join(__dirname, '/config.yml'), true));
  configLoader.add(new configStrategy.EnrichIntegrationFromRemoteConfigStrategy(ClientFactory));
  configLoader.add(new configStrategy.EnrichIntegrationConfigStrategy());

  return new stormpath.Client(configLoader);
};