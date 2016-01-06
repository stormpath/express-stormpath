'use strict';

var helpers = require('../helpers');
var url = require('url');

/**
 * This controller logs in an existing user with Facebook OAuth.
 *
 * When a user logs in with Facebook, all of the authentication happens on the
 * client side with Javascript.  Since all authentication happens with
 * Javascript, we *need* to force a newly created and / or logged in Facebook
 * user to redirect to this controller.
 *
 * What this controller does is:
 *
 *  - Grabs the user's Facebook access token from the query string.
 *  - Once we have the user's access token, we send it to Stormpath, so that
 *    we can either create (or update) the user on Stormpath's side.
 *  - Then we retrieve the Stormpath account object for the user, and log
 *    them in using our normal session support.
 *
 * The URL this controller is bound to, and the view used to render this page
 * can all be controlled via express-stormpath settings.
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
  var loginHandler = config.postLoginHandler;
  var registrationHandler = config.postRegistrationHandler;

  if (!req.query.access_token) {
    logger.info('A user attempted to log in via Facebook OAuth without specifying an OAuth token.');
    return res.status(400).json({ message: 'access_token parameter required.' });
  }

  var userData = {
    providerData: {
      accessToken: req.query.access_token,
      providerId: 'facebook'
    }
  };

  application.getAccount(userData, function (err, resp) {
    if (err) {
      logger.info('During a Facebook OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
      return res.status(err.status || 400).json(err);
    }

    helpers.expandAccount(req.app, resp.account, function (err, expandedAccount) {
      if (err) {
        logger.info('During a Facebook OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
        return res.status(err.status || 400).json(err);
      }

      res.locals.user = expandedAccount;
      req.user = expandedAccount;
      helpers.createIdSiteSession(req.user, req, res);

      var nextUrl = url.parse(req.query.next || '').path || (resp.created ? config.web.register.nextUri : config.web.login.nextUri);

      if (resp.created && registrationHandler) {
        registrationHandler(req.user, req, res, function () {
          res.redirect(302, nextUrl);
        });
      } else if (loginHandler) {
        loginHandler(req.user, req, res, function () {
          res.redirect(302, nextUrl);
        });
      } else {
        res.redirect(302, nextUrl);
      }
    });
  });
};
