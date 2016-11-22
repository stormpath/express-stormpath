'use strict';

var url = require('url');

var getHost = require('./get-host');

module.exports = function redirectToOrganization(req, res, organization) {
  var uri = req.protocol
    + '://' + organization.nameKey
    + '.'
    + getHost(req)
    + url.parse(req.url).pathname;

  var queryParams = Object.keys(req.query);

  if (queryParams.length > 0) {
    uri += '?' + queryParams.map(function (param) {
      return encodeURIComponent(param)
        + '='
        + encodeURIComponent(req.query[param]);
    }).join('&');
  }

  res.redirect(uri);
};
