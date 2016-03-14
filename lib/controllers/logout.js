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

  function cleanupSession(callback) {
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
  }

  function handlePostLogout(account, callback) {
    var postLogoutHandler = config.postLogoutHandler;

    if (postLogoutHandler) {
      return postLogoutHandler(account, req, res, callback);
    }

    callback();
  }

  function handleLogout(callback) {
    helpers.getUser(req, res, function () {
      var account = req.user;
      cleanupSession(function () {
        handlePostLogout(account, callback);
      });
    });
  }

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      handleLogout(function () {
        res.status(200).end();
      });
    },
    'text/html': function () {
      handleLogout(function () {
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
