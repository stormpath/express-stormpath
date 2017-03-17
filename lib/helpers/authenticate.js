'use strict';

var AccessTokenAuthenticator = require('../okta/access-token-authenticator');
var createSession = require('./create-session');
var passwordGrant = require('../okta/password-grant');

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
    options = options || {};
    options.username = options.login || options.username || '';
    options.password = options.password || '';

    if (!options.username || !options.password) {
      return callback(new Error('Invalid username or password.'));
    }

    passwordGrant(config, options, function (err, oauthAccessTokenResult) {
      if (err) {
        logger.info('Error when trying to authenticate user.');
        return callback(err);
      }

      var issuer = config.org + '/oauth2/' + config.authorizationServerId;

      var accessTokenAuthenticator = new AccessTokenAuthenticator(client).forIssuer(issuer).withLocalValidation();

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
