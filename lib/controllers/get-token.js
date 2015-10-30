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
  var logger = req.app.get('stormpathLogger');

  function writeErrorResponse(err) {
    logger.info('An OAuth token exchange failed due to an improperly formed request.');
    return res.status(err.statusCode || 400).json({
      error: err.userMessage || err.message || (err.statusCode === 401 ? 'Unauthorized' : 'Bad Request')
    });
  }

  if (req.method === 'POST' && req.body && req.body.grant_type) {
    var authenticator = new stormpath.OAuthAuthenticator(application);
    authenticator.authenticate(req, function (err, authResult) {
      if (err) {
        return writeErrorResponse(err);
      }

      res.json(authResult);
    });
  } else {
    application.authenticateApiRequest({
      request: req,
      ttl: req.app.get('stormpathOauthTTL'),
      scopeFactory: function (account, requestedScopes) {
        return requestedScopes;
      }
    }, function (err, authResult) {
      if (err) {
        return writeErrorResponse(err);
      }

      res.json(authResult.tokenResponse);
    });
  }
};
