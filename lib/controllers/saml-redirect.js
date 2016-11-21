'use strict';

var stormpath = require('stormpath');

module.exports = function(req, res) {
  var application = req.app.get('stormpathApplication');
  var builder = new stormpath.SamlIdpUrlBuilder(application);
  var config = req.app.get('stormpathConfig');
  var cbUri = req.protocol + '://' + req.get('host') + config.web.saml.verifyUri;

  var samlOptions = {
    cb_uri: cbUri
  };

  options = options || {};

  builder.build(samlOptions, function(err, url) {
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
