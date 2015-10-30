'use strict';

var helpers = require('../helpers');


/**
 * This controller logs in an existing user with Google OAuth.
 *
 * When a user logs in with Google (using Javascript), Google will redirect the
 * user to this view, along with an access code for the user.
 *
 * What we do here is grab this access code and send it to Stormpath to handle
 * the OAuth negotiation.  Once this is done, we log this user in using normal
 * sessions, and from this point on -- this user is treated like a normal system
 * user!
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

  if (!req.query.code) {
    logger.info('A user attempted to log in via Google OAuth without specifying an OAuth token.');
    return res.status(400).json({ message: 'code parameter required.' });
  }

  var userData = {
    providerData: {
      code: req.query.code,
      providerId: 'google'
    }
  };

  application.getAccount(userData, function (err, resp) {
    if (err) {
      logger.info('During a Google OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
      return res.status(err.status || 400).json(err);
    }

    res.locals.user = resp.account;
    req.user = resp.account;
    helpers.createIdSiteSession(req.user, req, res);

    var nextUrl = req.query.next || (resp.created ? config.web.register.nextUri : config.web.login.nextUri);

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
};
