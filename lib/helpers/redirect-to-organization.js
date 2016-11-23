'use strict';

var url = require('url');

var getHost = require('./get-host');

/**
* Performs a redirect to a subdomain of the current domain, using the name of
* the given organization as the name of the subdomain. Preserves port, path,
* and query parameters.
*
* @private
* @method
*
* @param {Object} req - HTTP request
* @param {Object} res - HTTP response
* @param {Object} organization - Organization resource
*/
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
