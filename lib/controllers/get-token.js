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
  if (!req.user) {
    res.status(401).json({ error: 'Invalid API credentials.' });
  } else {
    req.app.get('stormpathApplication').authenticateApiRequest({
      request: req,
      ttl: req.app.get('stormpathOauthTTL'),
      scopeFactory: function(account, requestedScopes) {
        return requestedScopes;
      }
    }, function(err, authResult) {
      if (err) {
        res.json(503, { error: 'Something went wrong. Please try again.' });
        req.app.get('stormpathLogger').info('An OAuth token exchange failed due to an improperly formed request.');
      } else {
        res.json(authResult.tokenResponse);
      }
    });
  }
};
