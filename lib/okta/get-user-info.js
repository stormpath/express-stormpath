'use strict';

var requestExecutor = require('./request-executor');

function getUserInfo(userInfoUrl, accessToken, callback) {
  var req = {
    url: userInfoUrl,
    method: 'GET',
    json: true,
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  };
  requestExecutor(req, callback);
}

module.exports = getUserInfo;
