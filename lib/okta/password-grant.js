'use strict';

var xtend = require('xtend');

var requestExecutor = require('./request-executor');

function passwordGrant(config, userFormSubmission, callback) {
  var req = {
    url: config.org + 'oauth2/' + config.authorizationServerId + '/v1/token',
    method: 'POST',
    json: true,
    form: xtend({
      client_id: config.authorizationServerClientId,
      client_secret: config.authorizationServerClientSecret,
      grant_type: 'password',
      scope: 'openid profile offline_access'
    }, userFormSubmission)
  };

  requestExecutor(req, callback);

}

module.exports = passwordGrant;
