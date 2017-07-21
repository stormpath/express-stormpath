'use strict';

var xtend = require('xtend');

var getHost = require('./get-host');
var resolveStateToken = require('../oauth/common').resolveStateToken;

function buildProviderModel(req, res) {
  var config = req.app.get('stormpathConfig');
  var oauthStateToken = resolveStateToken(req, res);
  var baseUrl = config.web.baseUrl || req.protocol + '://' + getHost(req);
  var providers = xtend({}, config.web.social);

  Object.keys(providers).forEach(function (providerId) {
    var provider = providers[providerId];
    provider.authorizeUri = provider.authorizeUri.replace(/{state}/, oauthStateToken);
    provider.authorizeUri = provider.authorizeUri.replace(/{redirectUri}/, baseUrl + provider.redirectUri);
  });

  return providers;
}

module.exports = buildProviderModel;