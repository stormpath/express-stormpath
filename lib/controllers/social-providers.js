'use strict';

/**
 * This controller returns a list of all available social providers.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function socialProviders(req, res) {
  var config = req.app.get('stormpathConfig');
  var socialProviderNames = Object.keys(config.web.social);

  var socialProviders = socialProviderNames.reduce(function (memo, providerName) {
    var provider = config.web.social[providerName];

    memo[providerName] = {
      enabled: provider.enabled,
      callbackUri: provider.uri,
      clientId: provider.clientId
    };

    return memo;
  }, {});

  res.send({
    socialProviders: socialProviders
  });
};
