'use strict';

var Cookies = require('cookies');

/**
 * Delete the token cookies that maintain a web session.
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var config = req.app.get('stormpathConfig');
  var cookies = new Cookies(req, res);

  cookies.set('idSiteSession');
  cookies.set(config.web.accessTokenCookie.name);
  cookies.set(config.web.refreshTokenCookie.name);
};
