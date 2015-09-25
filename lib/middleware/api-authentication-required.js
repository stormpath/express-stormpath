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
  // Wipe user data in case it was previously set by helpers.getUser().
  req.user = undefined;
  req.permissions = undefined;
  res.locals.user = undefined;
  res.locals.permissions = undefined;

  if (!req.headers.authorization) {
    req.app.get('stormpathLogger').info('User attempted to access a protected API endpoint with invalid credentials.');
    res.status(401).json({ error: 'Invalid API credentials.' });
  } else {
    req.app.get('stormpathApplication').authenticateApiRequest({ request: req }, function(err, authResult) {
      if (err) {
        req.app.get('stormpathLogger').info('Attempted to authenticate a user via the HTTP authorization header, but invalid credentials were supplied.');
        res.status(401).json({ error: 'Invalid API credentials.' });
      } else {
        authResult.getAccount(function(err, account) {
          if (err) {
            req.app.get('stormpathLogger').info('Attempted to retrieve a user\'s account, but this operation failed.');
            res.status(401).json({ error: 'Invalid API credentials.' });
            return;
          }

          helpers.expandAccount(req.app, account, function(err, expandedAccount) {
            if (err) {
              req.app.get('stormpathLogger').info('Attempted to expand a user\'s account, but this operation failed.');
              res.status(401).json({ error: 'Invalid API credentials.' });
              return;
            }

            res.locals.user = expandedAccount;
            res.locals.permissions = authResult.grantedScopes;
            req.user = expandedAccount;
            req.permissions = authResult.grantedScopes;

            return next();
          });
        });
      }
    });
  }
};
