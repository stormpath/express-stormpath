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
      return res.status(err.status || 400).json(err);
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
          return res.status(err.status || 400).json(err);
        }

        helpers.createSession(authenticationResult, authenticationResult.account, req, res);

        callback();
      });
    }

    function handleAuthRequest(type, callback) {
      var handler = config['post' + type + 'Handler'];

      if (handler) {
        handler(req.user, req, res, function () {
          authenticateToken(callback);
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
        handleAuthRequest('Registration', redirectNext);
        break;

      case 'AUTHENTICATED':
        handleAuthRequest('Login', redirectNext);
        break;

      case 'LOGOUT':
        middleware.revokeTokens(req, res);
        middleware.deleteCookies(req, res);

        var redirectUri = application.createIdSiteUrl({
          logout: true,
          callbackUri: req.protocol + '://' + req.get('host') + config.web.idSite.uri
        });

        res.redirect(302, redirectUri);
        break;

      default:
        res.status(500).end('Unknown ID site result status: ' + tokenStatus);
        break;
    }
  });
};