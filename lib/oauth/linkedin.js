'use strict';

var getHost = require('../helpers/get-host');
var request = require('request');

module.exports = {

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
    var baseUrl = config.web.baseUrl || req.protocol + '://' + getHost(req);
    var linkedInAuthUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
    var linkedInProvider = config.web.social.linkedin;

    var options = {
      form: {
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: baseUrl + linkedInProvider.uri,
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

      if (parsedBody.error) {
        var errorMessage;

        switch (parsedBody.error) {
          case 'unauthorized_client':
            errorMessage = 'Unable to authenticate with LinkedIn. Please verify that your configuration is correct.';
            break;

          default:
            errorMessage = 'LinkedIn error when exchanging auth code for access token: ' + parsedBody.error_description + ' (' + parsedBody.error + ')';
        }

        return callback(new Error(errorMessage));
      }

      callback(err, parsedBody.access_token);
    });
  }
};
