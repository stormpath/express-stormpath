'use strict';

var url = require('url');
var getHost = require('./get-host');

/**
* Redirects a request to the same path and port on a parent domain of the
* current sub-domain.
*
* @private
* @method
*
* @param {Object} req - HTTP request
* @param {Object} res - HTTP response
*/
module.exports = function (req, res) {
  var config = req.app.get('stormpathConfig');
  var parsedUrl = url.parse(req.protocol + '://' + getHost(req));
  var port = parsedUrl.port ? (':' + parsedUrl.port) : '';
  var pathname = url.parse(req.url).pathname;

  res.redirect(req.protocol + '://' + config.web.domainName + port + pathname);
};
