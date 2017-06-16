'use strict';

var xtend = require('xtend');

var requestExecutor = require('./request-executor');

function oktaOauthRequest(config, oauthRequest, callback) {
  var req =  {
    url: config.org + 'oauth2/' + config.authorizationServerId + '/v1/token',
    method: 'POST',
    json: true,
    form: xtend({
      client_id: config.authorizationServerClientId,
      client_secret: config.authorizationServerClientSecret
    }, oauthRequest)
  };

  requestExecutor(req, callback);

}

module.exports = oktaOauthRequest;
