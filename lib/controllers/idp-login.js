'use strict';

var AccessTokenAuthenticator = require('../okta/access-token-authenticator');
var createSession = require('../helpers/create-session');
var oauth = require('../oauth');

/**
 * This controller logs in an existing after a callback from Okta with an authorization code
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (provider, req, res) {
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var postLoginHandler = config.postLoginHandler;
  var postRegistrationHandler = config.postRegistrationHandler;

  if (req.query.code) {

    oauth.common.exchangeAuthCodeForAccessToken(req, provider, function (err, oauthAccessTokenResult) {
      if (err) {
        logger.info('During a Facebook OAuth login attempt, we were unable to exchange the authentication code for an access token.');
        return oauth.errorResponder(req, res, err);
      }

      var issuer = config.org + '/oauth2/' + config.authorizationServerId;

      var accessTokenAuthenticator = new AccessTokenAuthenticator(client).forIssuer(issuer).withLocalValidation();

      accessTokenAuthenticator.authenticate(oauthAccessTokenResult.access_token, function (err, authenticationResult) {

        if (err) {
          logger.info(err);
          return oauth.errorResponder(req, res, err);
        }

        authenticationResult.getAccount(function (err, user) {
          if (err) {
            logger.info(err);
            return oauth.errorResponder(req, res, err);
          }

          createSession(oauthAccessTokenResult, user, req, res);

          var nextUrl = oauth.common.consumeRedirectUri(req, res);

          // Was the user created in the last 10 seconds?

          var isNewUser = (new Date().getTime() - new Date(user.created).getTime()) < 60000 ;

          if (!nextUrl) {
            nextUrl = isNewUser ? config.web.register.nextUri : config.web.login.nextUri;
          }

          if (isNewUser && postRegistrationHandler) {
            postRegistrationHandler(req.user, req, res, function (err) {
              if (err) {
                logger.info('Error when trying to execute the postRegistrationHandler after authenticating the user.');
                return oauth.errorResponder(req, res, err);
              }
              res.redirect(302, nextUrl);
            });
          } else if (postLoginHandler) {
            postLoginHandler(req.user, req, res, function () {
              if (err) {
                logger.info('Error when trying to execute the postLoginHandler after authenticating the user.');
                return oauth.errorResponder(req, res, err);
              }
              res.redirect(302, nextUrl);
            });
          } else {
            res.redirect(302, nextUrl);
          }

        });

      });
    });
  } else if (req.query.error) {
    var errorString = req.query.error_description ? (req.query.error_description + ' (' + req.query.error + ')') : req.query.error;
    return oauth.errorResponder(req, res, new Error(errorString));
  } else {
    return oauth.errorResponder(req, res, new Error('Callback did not contain a code parameter.'));
  }
};
