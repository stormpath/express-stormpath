'use strict';

var stormpath = require('stormpath');

/**
 * Allow a developer to exchange their API keys for an OAuth token.
 *
 * The URL this controller is bound to can be controlled via express-stormpath
 * settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var grantType = req.body && req.body.grant_type;
  var logger = req.app.get('stormpathLogger');

  function writeErrorResponse(err) {
    logger.info('An OAuth token exchange failed due to an improperly formed request.');
    return res.status(err.status || err.statusCode || 400).json(err);
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  if (!grantType) {
    return writeErrorResponse({
      error: 'invalid_request'
    });
  }

  if (grantType === 'password' || grantType === 'refresh_token') {

    var authenticator = new stormpath.OAuthAuthenticator(application);
    authenticator.authenticate(req, function (err, authResult) {

      if (err) {
        return writeErrorResponse(err);
      }

      res.json(authResult.accessTokenResponse);
    });

  } else if (grantType === 'client_credentials') {
    application.authenticateApiRequest({
      request: req,
      ttl: config.web.oauth2.client_credentials.accessToken.ttl,
      scopeFactory: function (account, requestedScopes) {
        return requestedScopes;
      }
    }, function (err, authResult) {
      if (err) {
        return writeErrorResponse(err);
      }

      res.json(authResult.tokenResponse);
    });
  } else {
    writeErrorResponse({
      error: 'unsupported_grant_type'
    });
  }
};
