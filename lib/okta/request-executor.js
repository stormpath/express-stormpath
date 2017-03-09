'use strict';

var request = require('request');

function doRequest(requestShape, callback) {
  request(requestShape, function (err, res, body) {

    if (err) {
      return callback(err);
    }

    if (body && body.error) {
      return callback(new Error(body.error_description || body.error));
    }

    if (res.statusCode > 399) {
      return callback(new Error(body || res.statusCode));
    }

    callback(null, body);

  });
}

module.exports = doRequest;