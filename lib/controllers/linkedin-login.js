'use strict';

var url = require('url');

var helpers = require('../helpers');
var oauth = require('../oauth');

/**
 * This controller logs in an existing user with LinkedIn OAuth.
 *
 * When a user logs in with LinkedIn (using Javascript), LinkedIn will redirect the
 * user to this view, along with an access code for the user.
 *
 * What we do here is grab this access code, exchange it for an access token
 * using the LinkedIn API, and lastly send it to Stormpath to handle the OAuth
 * negotiation.  Once this is done, we log this user in using normal sessions,
 * and from this point on -- this user is treated like a normal system user!
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
    logger.info('A user attempted to log in via LinkedIn OAuth without specifying an OAuth token.');
    return oauth.errorResponder(req, res, new Error('code parameter required.'));
  }

  if (!oauth.common.consumeStateToken(req, res)) {
    logger.info('A user attempted to log in via LinkedIn OAuth with an invalid state token.');
    return oauth.errorResponder(req, res, new Error('Invalid state token provided.'));
  }

  oauth.linkedIn.exchangeAuthCodeForAccessToken(req, config, function (err, accessToken) {
    if (err) {
      logger.info('During a LinkedIn OAuth login attempt, we were unable to exchange the auth code for an access token.');
      return oauth.errorResponder(req, res, err);
    }

    var userData = {
      providerData: {
        accessToken: accessToken,
        providerId: 'linkedin'
      }
    };

    application.getAccount(userData, function (err, resp) {
      if (err) {
        logger.info('During a LinkedIn OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
        return oauth.errorResponder(req, res, err);
      }

      res.locals.user = resp.account;
      req.user = resp.account;

      helpers.createStormpathSession(req.user, req, res, function (err) {
        if (err) {
          logger.info('During a LinkedIn OAuth login attempt, we were unable to create a Stormpath session.');
          return oauth.errorResponder(req, res, err);
        }

        var nextUrl = oauth.common.consumeRedirectUri(req, res);
        if (!nextUrl) {
          nextUrl = url.parse(req.query.next || '').path || (resp.created ? config.web.register.nextUri : config.web.login.nextUri);
        }

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
  });
};
