'use strict';

var helpers = require('../helpers');
var middleware = require('../middleware');

/**
 * This controller handles a Stormpath ID Site authentication.  Once a user is
 * authenticated, they'll be returned to the site.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  application.handleIdSiteCallback(req.originalUrl, function (err, result) {
    if (err) {
      logger.info('While attempting to authenticate a user via ID site, the callback verification failed.');
      return res.status(500).end(err.toString());
    }

    if (result.status === 'LOGOUT') {
      middleware.deleteCookies(req, res);
      res.redirect(302, config.web.idSite.nextUri);
    } else if (result.status === 'AUTHENTICATED') {
      var url = req.query.next || config.web.idSite.nextUri;

      helpers.createIdSiteSession(result.account, req, res);
      res.redirect(302, url);
    } else {
      res.status(500).end('Unknown ID site result status: ' + result.status);
    }
  });
};
