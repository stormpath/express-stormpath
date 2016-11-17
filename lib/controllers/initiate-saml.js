'use strict';

var stormpath = require('stormpath');

module.exports = function(req, res) {
  var application = req.app.get('stormpathApplication');
  var builder = new stormpath.SamlIdpUrlBuilder(application);

  builder.build(function(err, url) {
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
