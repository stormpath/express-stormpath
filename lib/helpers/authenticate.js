'use strict';

var stormpath = require('stormpath');
var expandAccount = require('./expand-account');
var createSession = require('./create-session');

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
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var application = req.app.get('stormpathApplication');

  function continueWithAuthentication() {
    options = options || {};
    options.username = options.login || options.username || '';
    options.password = options.password || '';

    if (!options.username || !options.password) {
      return callback(new Error('Invalid username or password.'));
    }

    var authenticator = new stormpath.OAuthPasswordGrantRequestAuthenticator(application);

    authenticator.authenticate(options, function (err, authResult) {
      if (err) {
        logger.info('Error when trying to authenticate user.');
        return callback(err);
      }

      authResult.getAccount(function (err, account) {
        if (err) {
          logger.info('Error when trying to retrieve the account for the authenticated user.');
          return callback(err);
        }

        expandAccount(account, config.expand, logger, function (err, expandedAccount) {
          if (err) {
            logger.info('Error when trying to expand the account of the authenticated user.');
            return callback(err);
          }

          req.user = expandedAccount;
          createSession(authResult, expandedAccount, req, res);

          if (config.postLoginHandler) {
            return config.postLoginHandler(expandedAccount, req, res, function (err) {
              if (err) {
                logger.info('Error when trying to execute the postLoginHandler after authenticating the user.');
                return callback(err);
              }

              callback(null, expandedAccount, authResult);
            });
          }

          callback(null, expandedAccount, authResult);
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