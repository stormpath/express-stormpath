'use strict';

var idSiteRedirect = require('./id-site-redirect');
var middleware = require('../middleware');

/**
 * This controller logs out an existing user, then redirects them to the
 * homepage.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var config = req.app.get('stormpathConfig');
  var accepts = req.accepts(['html', 'json']);
  var nextUri = req.query.next;

  middleware.revokeTokens(req, res);
  middleware.deleteCookies(req, res);

  if (accepts === 'json') {
    return res.status(200).end();
  }

  if (req.cookies && req.cookies.idSiteSession && config.web.idSite.enabled) {
    return idSiteRedirect({ logout: true })(req, res);
  }

  var url = nextUri || config.web.logout.nextUri;
  res.redirect(url);
};
