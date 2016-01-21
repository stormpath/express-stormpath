'use strict';

var helpers = require('../helpers');
var middleware = require('../middleware');
var url = require('url');

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

    var idSiteNextUri = config.web.idSite.nextUri;

    switch (result.status) {
      case 'LOGOUT':
        middleware.deleteCookies(req, res);
        res.redirect(302, idSiteNextUri);
        break;
      case 'REGISTERED':
      case 'AUTHENTICATED':
        if (result.status === 'AUTHENTICATED' || (result.status === 'REGISTERED' && config.web.register.autoLogin)) {
          helpers.createIdSiteSession(result.account, req, res);
        }

        var nextUrl = url.parse(req.query.next || '').path || idSiteNextUri;

        res.redirect(302, nextUrl);
        break;
      default:
        res.status(500).end('Unknown ID site result status: ' + result.status);
        break;
    }
  });
};