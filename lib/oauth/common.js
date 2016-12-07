'use strict';

var uuid = require('uuid');
var qs = require('querystring');
var request = require('request');

var setTempCookie = require('../helpers/set-temp-cookie');

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
      setTempCookie(res, 'oauthStateToken', oauthStateToken);
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
  },

  /**
   * Exchange an authentication code for an OAuth access token.
   *
   * @method
   * @private
   *
   * @param {string} authUrl - The url to use to make the exchange.
   * @param {string} code - The authentication code.
   * @param {string} baseUrl - The base url to prepend to the callback uri.
   * @param {Object} provider - The provider object that contains the client id, secret, and uri.
   * @param {Function} callback - The callback to call once a response has been resolved.
   */
  exchangeAuthCodeForAccessToken: function (authUrl, code, oauthStateToken, baseUrl, provider, callback) {
    var options = {
      form: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: baseUrl + provider.uri,
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        state: oauthStateToken
      },
      headers: {
        Accept: 'application/json'
      }
    };

    request.post(authUrl, options, function (err, result, body) {
      var parsedBody;

      if (err) {
        return callback(err);
      }

      var contentType = result.headers['content-type'] || '';

      if (contentType.indexOf('text/plain') === 0) {
        parsedBody = qs.parse(body);
      } else {
        try {
          parsedBody = JSON.parse(body);
        } catch (err) {
          return callback(err);
        }

        if (parsedBody.error) {
          return callback(new Error(parsedBody.error));
        }
      }

      if (!parsedBody || typeof parsedBody !== 'object' || !parsedBody.access_token) {
        return callback(new Error('Unable to parse response when exchanging an authorization code for an access token.'));
      }

      callback(null, parsedBody.access_token);
    });
  }
};
