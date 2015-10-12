'use strict';

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
module.exports = function(req, res) {
  var logger = req.app.get('stormpathLogger');

  if (!req.user) {
    return res.status(401).json({ error: 'Invalid API credentials.' });
  }

  req.app.get('stormpathApplication').authenticateApiRequest({
    request: req,
    ttl: req.app.get('stormpathOauthTTL'),
    scopeFactory: function(account, requestedScopes) {
      return requestedScopes;
    }
  }, function(err, authResult) {
    if (err) {
      logger.info('An OAuth token exchange failed due to an improperly formed request.');
      return res.status(503).json({ error: 'Something went wrong. Please try again.' });
    }

    res.json(authResult.tokenResponse);
  });
};
