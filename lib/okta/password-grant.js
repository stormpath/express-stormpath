'use strict';

var xtend = require('xtend');

var requestExecutor = require('./request-executor');

function passwordGrant(config, userFormSubmission, callback) {
  var req = {
    url: config.okta.org + 'oauth2/' + config.okta.authorizationServerId + '/v1/token',
    method: 'POST',
    json: true,
    form: xtend({
      client_id: config.okta.authorizationServerClientId,
      grant_type: 'password',
      scope: 'openid profile'
    }, userFormSubmission)
  };

  requestExecutor(req, callback);
  
}

module.exports = passwordGrant;