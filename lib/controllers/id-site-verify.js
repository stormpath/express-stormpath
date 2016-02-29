'use strict';

var url = require('url');
var nJwt = require('njwt');
var stormpath = require('stormpath');

var helpers = require('../helpers');
var middleware = require('../middleware');

/**
 * This controller handles a Stormpath ID Site authentication.  Once a user is
 * authenticated, they'll be returned to the site.
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
      logger.info('During an IdSite login attempt, we were unable to verify the JWT response.');
      return helpers.writeJsonError(res, err);
    }

    var parsedToken = nJwt.verify(stormpathToken, config.client.apiKey.secret);
    var tokenStatus = parsedToken.body.status;

    function redirectNext() {
      var nextUri = config.web.idSite.nextUri;
      var nextQueryPath = url.parse(params.next || '').path;
      res.redirect(302, nextQueryPath || nextUri);
    }

    function authenticateToken(callback) {
      var stormpathTokenAuthenticator = new stormpath.OAuthStormpathTokenAuthenticator(application);

      stormpathTokenAuthenticator.authenticate({ stormpath_token: stormpathToken }, function (err, authenticationResult) {
        if (err) {
          logger.info('During an IdSite login attempt, we were unable to create a Stormpath session.');
          return helpers.writeJsonError(res, err);
        }

        authenticationResult.getAccount(function (err, account) {
          if (err) {
            logger.info('During an IdSite login attempt, we were unable to retrieve an account from the authentication result.');
            return helpers.writeJsonError(res, err);
          }

          helpers.expandAccount(account, config.expand, logger, function (err, expandedAccount) {
            if (err) {
              logger.info('During an IdSite login attempt, we were unable to expand the Stormpath account.');
              return helpers.writeJsonError(res, err);
            }

            helpers.createSession(authenticationResult, expandedAccount, req, res);

            callback(null, expandedAccount);
          });
        });
      });
    }

    function handleAuthRequest(type, callback) {
      var handler;

      switch (type) {
        case 'registration':
          handler = config.postRegistrationHandler;
          break;
        case 'login':
          handler = config.postLoginHandler;
          break;
        default:
          return callback(new Error('Invalid authentication request type: ' + type));
      }

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

    switch (tokenStatus) {
      case 'REGISTERED':
        if (!config.web.register.autoLogin) {
          return redirectNext();
        }
        handleAuthRequest('registration', redirectNext);
        break;

      case 'AUTHENTICATED':
        handleAuthRequest('login', redirectNext);
        break;

      case 'LOGOUT':
        middleware.revokeTokens(req, res);
        middleware.deleteCookies(req, res);
        redirectNext();
        break;

      default:
        res.status(500).end('Unknown ID site result status: ' + tokenStatus);
        break;
    }
  });
};