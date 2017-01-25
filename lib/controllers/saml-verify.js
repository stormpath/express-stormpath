'use strict';

var url = require('url');
var stormpath = require('stormpath');

var helpers = require('../helpers');

/**
 * This controller handles a Stormpath SAML authentication.  Once a user is
 * authenticated, they'll be returned to the site.
 *
 * The returned JWT is verified and an attempt is made to exchange it for an
 * access token and refresh token, using the `stormpath_token` grant type, and
 * recording the user in the session.
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

  var params = req.query || {};
  var stormpathToken = params.jwtResponse || '';
  var assertionAuthenticator = new stormpath.StormpathAssertionAuthenticator(application);

  assertionAuthenticator.authenticate(stormpathToken, function (err) {
    if (err) {
      logger.info('During a SAML login attempt, we were unable to verify the JWT response.');
      return helpers.writeJsonError(res, err);
    }

    function redirectNext() {
      var nextUri = config.web.saml.nextUri;
      var nextQueryPath = url.parse(params.next || '').path;
      res.redirect(302, nextQueryPath || nextUri);
    }

    function authenticateToken(callback) {
      var stormpathTokenAuthenticator = new stormpath.OAuthStormpathTokenAuthenticator(application);

      stormpathTokenAuthenticator.authenticate({ stormpath_token: stormpathToken }, function (err, authenticationResult) {
        if (err) {
          logger.info('During a SAML login attempt, we were unable to create a Stormpath session.');
          return helpers.writeJsonError(res, err);
        }

        authenticationResult.getAccount(function (err, account) {
          if (err) {
            logger.info('During a SAML login attempt, we were unable to retrieve an account from the authentication result.');
            return helpers.writeJsonError(res, err);
          }

          helpers.expandAccount(account, config.expand, logger, function (err, expandedAccount) {
            if (err) {
              logger.info('During a SAML login attempt, we were unable to expand the Stormpath account.');
              return helpers.writeJsonError(res, err);
            }

            helpers.createSession(authenticationResult, expandedAccount, req, res);

            callback(null, expandedAccount);
          });
        });
      });
    }

    function handleAuthRequest(callback) {
      var handler = config.postLoginHandler;

      if (handler) {
        authenticateToken(function (err, expandedAccount) {
          if (err) {
            return callback(err);
          }

          handler(expandedAccount, req, res, callback);
        });
      } else {
        authenticateToken(callback);
      }
    }

    handleAuthRequest(redirectNext);
  });
};
