'use strict';

var request = require('request');

module.exports = {
  _getBaseUrl: function (req) {
    return req.protocol + '://' + req.get('host');
  },

  /**
   * Exchange a LinkedIn authentication code for a OAuth access token.
   *
   * @method
   * @private
   *
   * @param {Object} req - The http request.
   * @param {string} config - The Stormpath express config object.
   * @param {string} callback - The callback to call once a response has been resolved.
   */
  exchangeAuthCodeForAccessToken: function (req, config, callback) {
    var linkedInAuthUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
    var linkedInProvider = config.socialProviders.linkedin;

    var options = {
      form: {
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: this._getBaseUrl(req) + linkedInProvider.callbackUri,
        client_id: linkedInProvider.clientId,
        client_secret: linkedInProvider.clientSecret
      }
    };

    request.post(linkedInAuthUrl, options, function (err, result, body) {
      var parsedBody;

      try {
        parsedBody = JSON.parse(body);
      } catch (err) {
        return callback(err);
      }

      callback(err, parsedBody.access_token);
    });
  }
};
