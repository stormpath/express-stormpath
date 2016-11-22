'use strict';

var url = require('url');

var getHost = require('./get-host');

module.exports = function redirectToOrganization(req, res, organization) {
  res.redirect(req.protocol + '://' + organization.nameKey + '.' + getHost(req) + url.parse(req.url).pathname);
};
