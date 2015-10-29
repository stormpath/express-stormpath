'use strict';

var helpers = require('../helpers');

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
      return helpers.render(req, res, req.app.get('stormpathFacebookLoginFailedView'));
    }

    res.locals.user = resp.account;
    req.user = resp.account;
    helpers.createIdSiteSession(req.user, req, res);

    var url = req.query.next || (resp.created ? config.web.register.nextUri : config.web.login.nextUri);
    res.redirect(302, url);
  });
};
