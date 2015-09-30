var path = require('path');
var stormpath = require('stormpath');
var stormpathConfig = require('stormpath-config');
var configStrategy = stormpathConfig.strategy;

// Factory method to create a client using a configuration only.
// The configuration provided to this factory is the final configuration.
function ClientFactory (config) {
  return new stormpath.Client(
    new stormpathConfig.Loader([
      new configStrategy.ExtendConfigStrategy(config)
    ])
  );
}

// Grab the configuration that we need for our integration
// so that we can override the loaded configuration with it.
function getIntegrationConfig (config) {
  var result = {};

  if (config) {
    if (config.web) {
      result.web = config.web;
    }
    if (config.socialProviders) {
      result.socialProviders = config.socialProviders;
    }
  }

  return result;
}

module.exports = function (config) {
  var configLoader = stormpath.configLoader(config);

  // Load our default (hard-coded) integration configuration.
  configLoader.add(new configStrategy.LoadFileConfigStrategy(path.join(__dirname, '/config.yml'), true));
  configLoader.add(new configStrategy.ExtendConfigStrategy(getIntegrationConfig(config)));
  configLoader.add(new configStrategy.EnrichIntegrationFromRemoteConfigStrategy(ClientFactory));
  configLoader.add(new configStrategy.EnrichIntegrationConfigStrategy());

  return new stormpath.Client(configLoader);
};