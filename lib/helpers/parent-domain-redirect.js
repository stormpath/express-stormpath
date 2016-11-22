'use strict';

var url = require('url');
var getHost = require('./get-host');

module.exports = function (req, res, config) {
  var parsedUrl = url.parse(req.protocol + '://' + getHost(req));
  var port = parsedUrl.port ? (':' + parsedUrl.port) : '';
  var pathname = url.parse(req.url).pathname;

  res.redirect(req.protocol + '://' + config.web.domainName + port + pathname);
};
