'use strict';

var getHost = require('../helpers/get-host');

/**
 * This controller registers a new user using Stormpath's hosted ID Site
 * service.  This will redirect the user to the ID site which allows a user to
 * register.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (options) {
  return function (req, res) {
    var application = req.app.get('stormpathApplication');
    var config = req.app.get('stormpathConfig');
    var cbUri = req.protocol + '://' + getHost(req) + config.web.idSite.uri;

    var url = application.createIdSiteUrl({
      callbackUri: cbUri,
      logout: options.logout,
      path: options.path
    });

    res.writeHead(302, {
      'Cache-Control': 'no-store',
      'Location': url,
      'Pragma': 'no-cache'
    });

    res.end();
  };
};
