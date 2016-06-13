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

  function deleteCookie(name, cookieConfig) {
    cookies.set(name, '', {
      domain: cookieConfig.domain,
      path: cookieConfig.path || '/'
    });
  }

  deleteCookie(config.web.accessTokenCookie.name, config.web.accessTokenCookie);
  deleteCookie(config.web.refreshTokenCookie.name, config.web.refreshTokenCookie);
};
