'use strict';

var Cookies = require('cookies');
var helpers = require('../helpers');

/**
 * Revokes any tokens currently attached to the request.
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var cookies = new Cookies(req, res);

  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  function noop(err) {
    if (err) {
      logger.error(err);
    }
  }

  var accessTokenJwt = cookies.get(config.web.accessTokenCookie.name);
  var refreshTokenJwt = cookies.get(config.web.refreshTokenCookie.name);

  if (accessTokenJwt) {
    helpers.revokeToken.revokeAccessToken(config, accessTokenJwt, noop);
  }

  if (refreshTokenJwt) {
    helpers.revokeToken.revokeRefreshToken(config, refreshTokenJwt, noop);
  }
};
