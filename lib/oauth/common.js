'use strict';

var uuid = require('uuid');

var helpers = require('../helpers');

module.exports = {
  /**
   * Consume a state token cookie.
   *
   * @method
   * @private
   *
   * @param {Object} req - The http request.
   * @param {Object} res - The http response.
   * @return {bool} Whether or not the token was successfully verified and consumed.
   */
  consumeStateToken: function (req, res) {
    var oauthQueryStateToken = req.query.state;
    var oauthCookieStateToken = req.cookies.oauthStateToken;

    if (!oauthQueryStateToken || (!oauthCookieStateToken)) {
      return false;
    } else if (oauthQueryStateToken !== oauthCookieStateToken) {
      return false;
    }

    res.clearCookie('oauthStateToken');

    return true;
  },

  /**
   * Resolve a state token from a request.
   * If then token doesn't exist then a new token is created and appended onto the response.
   *
   * @method
   * @private
   *
   * @param {Object} req - The http request.
   * @param {Object} res - The http response.
   * @return {string} A state token (UUID).
   */
  resolveStateToken: function (req, res) {
    var oauthStateToken = req.cookies.oauthStateToken;

    if (!oauthStateToken) {
      oauthStateToken = uuid.v4();
      helpers.setTempCookie(res, 'oauthStateToken', oauthStateToken);
    }

    return oauthStateToken;
  },

  /**
   * Consume a redirect uri cookie.
   *
   * @method
   * @private
   *
   * @param {Object} req - The http request.
   * @param {Object} res - The http response.
   * @return {mixed} The redirect uri (string) or false if didn't exist.
   */
  consumeRedirectUri: function (req, res) {
    var redirectTo = req.cookies.oauthRedirectUri || false;

    if (redirectTo) {
      res.clearCookie('oauthRedirectUri');
    }

    return redirectTo;
  }
};
