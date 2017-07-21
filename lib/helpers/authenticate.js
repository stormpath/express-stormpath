'use strict';

var AccessTokenAuthenticator = require('../okta/access-token-authenticator');
var createSession = require('./create-session');
var oktaOAuthRequest = require('../okta/oauth-request');

/**
 * Authenticate a user with username/password credentials.
 *
 * @function
 *
 * @param {Object} options - Authentication options.
 * @param {Object} req - HTTP request.
 * @param {Object} res - HTTP response.
 * @param {function} callback - Function to call when completed.
 */
module.exports = function authenticate(options, req, res, callback) {
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  function continueWithAuthentication() {
    var oauthRequest = options || {};
    oauthRequest.username = oauthRequest.login || oauthRequest.username || '';
    oauthRequest.password = oauthRequest.password || '';

    if (!oauthRequest.username || !oauthRequest.password) {
      return callback(new Error('Invalid username or password.'));
    }

    oauthRequest.grant_type = 'password';
    oauthRequest.scope = 'openid profile offline_access';

    oktaOAuthRequest(config, oauthRequest, function (err, oauthAccessTokenResult) {
      if (err) {
        logger.info('Error when trying to authenticate user.');
        return callback(err);
      }

      var issuer = config.org + '/oauth2/' + config.authorizationServerId;

      var accessTokenAuthenticator = new AccessTokenAuthenticator(client).forIssuer(issuer);

      if (config.web.oauth2.password.validationStrategy === 'local') {
        accessTokenAuthenticator.withLocalValidation();
      }

      accessTokenAuthenticator.authenticate(oauthAccessTokenResult.access_token, function (err, authenticationResult) {

        if (err) {
          logger.info(err);
          return callback(err);
        }

        authenticationResult.getAccount(function (err, user) {
          if (err) {
            logger.info(err);
            return callback(err);
          }

          createSession(oauthAccessTokenResult, user, req, res);

          if (config.postLoginHandler) {
            return config.postLoginHandler(user, req, res, function (err) {
              if (err) {
                logger.info('Error when trying to execute the postLoginHandler after authenticating the user.');
                return callback(err);
              }

              callback(null, user, oauthAccessTokenResult);
            });
          }

          callback(null, user, oauthAccessTokenResult);
        });

      });
    });
  }

  if (config.preLoginHandler) {
    return config.preLoginHandler(options, req, res, function (err) {
      if (err) {
        logger.info('Error when trying to execute the preLoginHandler before authenticating the user.');
        return callback(err);
      }

      continueWithAuthentication();
    });
  }

  continueWithAuthentication();
};
