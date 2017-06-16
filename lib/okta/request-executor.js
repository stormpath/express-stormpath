'use strict';

var request = require('request');

function doRequest(requestShape, callback) {
  request(requestShape, function (err, res, body) {

    if (err) {
      return callback(err);
    }

    if (body && body.error || body.error_description) {
      return callback(body);
    }

    if (res.statusCode > 399) {
      return callback(new Error(body || res.statusCode));
    }

    callback(null, body);

  });
}

module.exports = doRequest;