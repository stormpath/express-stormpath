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
  function cleanupSession(callback) {
    helpers.getUser(req, res, function () {
      // Retrieve the user and remove it from the request.
      var account = req.user;
      delete req['user'];

      // Remove tokens.
      middleware.revokeTokens(req, res);
      middleware.deleteCookies(req, res);

      // If we have have an account, then invalidate the cache for it.
      if (account) {
        return account.invalidate(function () {
          callback();
        });
      }

      callback();
    });
  }

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      cleanupSession(function () {
        res.status(200).end();
      });
    },
    'text/html': function () {
      cleanupSession(function () {
        var config = req.app.get('stormpathConfig');

        if (config.web.idSite.enabled) {
          return idSiteRedirect({ logout: true })(req, res);
        }

        var queryNextPath = url.parse(req.query.next || '').path;
        var nextUri = queryNextPath || config.web.logout.nextUri;

        res.redirect(nextUri);
      });
    }
  }, next);
};
