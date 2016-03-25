'use strict';

var helpers = require('../helpers');
var stormpath = require('stormpath');
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
module.exports = function (req, res, next) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  // Wipe user data in case it was previously set by helpers.getUser().
  req.authenticationResult = undefined;
  req.user = undefined;
  req.permissions = undefined;
  res.locals.authenticationResult = undefined;
  res.locals.user = undefined;
  res.locals.permissions = undefined;

  function handleAuthResponse(err, authResult) {
    if (err) {
      logger.info('Attempted to authenticate a user via the HTTP authorization header, but invalid credentials were supplied.');
      return helpers.writeJsonError(res, { status: 401, message: 'Invalid API credentials.' });
    }

    authResult.getAccount(function (err, account) {
      if (err) {
        logger.info('Attempted to retrieve a user\'s account, but this operation failed.');
        return helpers.writeJsonError(res, { status: 401, message: 'Invalid API credentials.' });
      }

      helpers.expandAccount(account, config.expand, logger, function (err, expandedAccount) {
        if (err) {
          logger.info('Attempted to expand a user\'s account, but this operation failed.');
          return helpers.writeJsonError(res, { status: 401, message: 'Invalid API credentials.' });
        }

        res.locals.authenticationResult = authResult;
        res.locals.user = expandedAccount;
        res.locals.permissions = authResult.grantedScopes;
        req.authenticationResult = authResult;
        req.user = expandedAccount;
        req.permissions = authResult.grantedScopes;

        next();
      });
    });
  }

  var authHeader = req.headers.authorization;

  var token = authHeader && authHeader.match(/Bearer .+/) ? authHeader.split('Bearer ')[1] : '';

  var isBasic = req.headers.authorization && req.headers.authorization.match(/Basic .+/);

  if (token) {
    var authenticator = new stormpath.JwtAuthenticator(application);
    if (config.web.oauth2.password.validationStrategy === 'local') {
      authenticator.withLocalValidation();
    }
    return authenticator.authenticate(token, handleAuthResponse);
  } else if (isBasic) {
    return application.authenticateApiRequest({ request: req }, handleAuthResponse);
  } else {
    res.status(401).send('Unauthorized');
  }

};
