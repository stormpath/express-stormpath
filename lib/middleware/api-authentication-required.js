'use strict';

var helpers = require('../helpers');

/**
 * Assert that a user has specified valid API credentials before allowing them
 * to continue.  If the user's credentials are invalid, a 401 will be returned
 * along with an appropriate error message.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {nextCallback} next - The callback which is called to continue
 *   processing the request if the user is authenticated.
 */
module.exports = function(req, res, next) {
  var application = req.app.get('stormpathApplication');
  var logger = req.app.get('stormpathLogger');

  // Wipe user data in case it was previously set by helpers.getUser().
  req.apiKey = undefined;
  req.user = undefined;
  req.permissions = undefined;
  res.locals.apiKey = undefined;
  res.locals.user = undefined;
  res.locals.permissions = undefined;

  application.authenticateApiRequest({ request: req }, function(err, authResult) {
    if (err) {
      logger.info('Attempted to authenticate a user via the HTTP authorization header, but invalid credentials were supplied.');
      return res.status(401).json({ error: 'Invalid API credentials.' });
    }

    authResult.getAccount(function(err, account) {
      if (err) {
        logger.info('Attempted to retrieve a user\'s account, but this operation failed.');
        return res.status(401).json({ error: 'Invalid API credentials.' });
      }

      helpers.expandAccount(req.app, account, function(err, expandedAccount) {
        if (err) {
          logger.info('Attempted to expand a user\'s account, but this operation failed.');
          return res.status(401).json({ error: 'Invalid API credentials.' });
        }

        res.locals.apiKey = authResult;
        res.locals.user = expandedAccount;
        res.locals.permissions = authResult.grantedScopes;
        req.apiKey = authResult;
        req.user = expandedAccount;
        req.permissions = authResult.grantedScopes;

        next();
      });
    });
  });
};
