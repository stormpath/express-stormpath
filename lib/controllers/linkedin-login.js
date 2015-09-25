'use strict';

var helpers = require('../helpers');
var oauth = require('../oauth');

/**
 * This controller logs in an existing user with LinkedIn OAuth.
 *
 * When a user logs in with LinkedIn (using Javascript), LinkedIn will redirect the
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
module.exports = function(req, res) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var loginHandler = req.app.get('stormpathPostLoginHandler');
  var registrationHandler = req.app.get('stormpathPostRegistrationHandler');

  if (!req.query.code) {
    res.status(400).json({message:'code parameter required'});
    logger.info('A user attempted to log in via LinkedIn OAuth without specifying an OAuth token.');
    return;
  }

  if (!oauth.common.consumeStateToken(req, res)) {
    res.status(400).json({ message: 'invalid state token provided' });
    logger.info('A user attempted to log in via LinkedIn OAuth with an invalid state token.');
    return;
  }

  oauth.linkedIn.exchangeAuthCodeForAccessToken(req, config, function (err, accessToken) {
    var userData = {
      providerData: {
        providerId: 'linkedin',
        accessToken: accessToken
      }
    };

    application.getAccount(userData, function(err, resp) {
      if (err) {
        res.status(err.status || 400).json(err);
        logger.info('During a LinkedIn OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
      } else {
        res.locals.user = resp.account;
        req.user = resp.account;

        // Generate a new session -- this creates a session cookie.
        helpers.createIdSiteSession(req.user, req, res);

        var nextUrl = oauth.common.consumeRedirectUri(req, res);

        if (!nextUrl) {
          nextUrl = req.query.next || (resp.created ? config.web.register.nextUri : config.web.login.nextUri);
        }

        if (resp.created && registrationHandler) {
          registrationHandler(req.user, req, res, function() {
            res.redirect(302, nextUrl);
          });
        } else if (loginHandler) {
          loginHandler(req.user, req, res, function() {
            res.redirect(302, nextUrl);
          });
        } else {
          res.redirect(302, nextUrl);
        }
      }
    });
  });
};