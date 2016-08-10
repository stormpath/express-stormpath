'use strict';

var url = require('url');

var helpers = require('../helpers');
var oauth = require('../oauth');

/**
 * This controller logs in a user with GitHub OAuth.
 *
 * When a user logs in with GitHub (using JavaScript), GitHub will redirect the
 * user to this view, along with an access code for the user.
 *
 * What we do here is grab this access code, exchange it for an access token
 * using the GitHub API, and lastly send it to Stormpath to handle the OAuth
 * negotiation. Once this is done, we log this user in using normal sessions,
 * and from this point on -- this user is treated like a normal system user!
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
  var provider = config.web.social.github;
  var baseUrl = config.web.baseUrl || req.protocol + '://' + helpers.getHost(req);
  var authUrl = 'https://github.com/login/oauth/access_token';
  var code = req.query.code;
  var error = req.query.error;

  if (error) {
    logger.info('A user attempted to log in via GitHub OAuth but recieved the error " ' + error + '"');
    return oauth.errorResponder(req, res, new Error(error));
  }

  if (!code) {
    logger.info('A user attempted to log in via GitHub OAuth without specifying an OAuth token.');
    return oauth.errorResponder(req, res, new Error('code parameter required.'));
  }

  oauth.common.exchangeAuthCodeForAccessToken(authUrl, code, req.cookies.oauthStateToken, baseUrl, provider, function (err, accessToken) {
    if (err) {
      logger.info('During a GitHub OAuth login attempt, we were unable to exchange the authentication code for an access token.');
      return oauth.errorResponder(req, res, err);
    }

    var userData = {
      providerData: {
        accessToken: accessToken,
        providerId: 'github'
      }
    };

    application.getAccount(userData, function (err, resp) {
      if (err) {
        logger.info('During a GitHub OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
        return oauth.errorResponder(req, res, err);
      }

      helpers.expandAccount(resp.account, config.expand, logger, function (err, expandedAccount) {
        if (err) {
          logger.info('During a GitHub OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
          return oauth.errorResponder(req, res, err);
        }

        res.locals.user = expandedAccount;
        req.user = expandedAccount;

        helpers.createStormpathSession(req.user, req, res, function (err) {
          if (err) {
            logger.info('During a GitHub OAuth login attempt, we were unable to create a Stormpath session.');
            return oauth.errorResponder(req, res, err);
          }

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
    });
  });
};
