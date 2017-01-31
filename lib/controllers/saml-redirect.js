'use strict';

var stormpath = require('stormpath');

/**
 * This controller initiates a SAML login process, allowing the user to register
 * via a registered SAML provider.
 *
 * When the user logs in through the SAML provider, they will be redirected back
 * (to the SAML verification URL).
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var application = req.app.get('stormpathApplication');
  var builder = new stormpath.SamlIdpUrlBuilder(application);
  var config = req.app.get('stormpathConfig');
  var host = config.web.saml.host || req.get('host');
  var protocol = config.web.saml.protocol || req.protocol;
  var cbUri = protocol + '://' + host + config.web.saml.verifyUri;

  var samlOptions = {
    cb_uri: cbUri
  };

  builder.build(samlOptions, function (err, url) {
    if (err) {
      throw err;
    }

    res.writeHead(302, {
      'Cache-Control': 'no-store',
      'Location': url,
      'Pragma': 'no-cache'
    });

    res.end();
  });
};
