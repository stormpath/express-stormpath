'use strict';

var url = require('url');

var helpers = require('../helpers');
var middleware = require('../middleware');
var idSiteRedirect = require('./id-site-redirect');

/**
 * This controller logs out an existing user, then redirects them to the
 * homepage.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {function} next - The next function.
 */
module.exports = function (req, res, next) {
  var config = req.app.get('stormpathConfig');

  function removeTokens() {
    middleware.revokeTokens(req, res);
    middleware.deleteCookies(req, res);
  }

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      removeTokens();
      res.status(200).end();
    },
    'text/html': function () {
      removeTokens();

      if (config.web.idSite.enabled) {
        return idSiteRedirect({ logout: true })(req, res);
      }

      var queryNextPath = url.parse(req.query.next || '').path;
      var nextUri = queryNextPath || config.web.logout.nextUri;

      res.redirect(nextUri);
    }
  }, next);
};
