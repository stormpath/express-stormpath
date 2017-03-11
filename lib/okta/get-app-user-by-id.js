'use strict';

var requestExecutor = require('./request-executor');

function getAppUserById(org, appId, apiToken, uid, callback) {
  var req = {
    url: org + '/api/v1/apps/' + appId + '/users/' + uid,
    headers: {
      Authorization: 'SSWS ' + apiToken
    },
    json: true
  };
  requestExecutor(req, callback);
}

module.exports = getAppUserById;
