'use strict';

var nJwt = require('njwt');
var stormpath = require('stormpath');

/**
 * Takes an account and creates a Stormpath JWT and exchanges it for an OAuth authentication result.
 *
 * @param  {Object} req                  Express HTTP request.
 * @param  {Object} account              Account to authenticate.
 * @param  {function} callback           Callback to call once the token cookie(s) has been set.
 */
module.exports = function exchangeStormpathToken(req, account, callback) {
  var config = req.app.get('stormpathConfig');
  var application = req.app.get('stormpathApplication');

  var apiKey = config.client.apiKey;

  var payload = {
    sub: account.href,
    iat: new Date().getTime() / 1000,
    iss: application.href,
    status: 'AUTHENTICATED',
    aud: apiKey.id
  };

  var token = nJwt.create(payload, apiKey.secret, 'HS256');

  // Token is only used for exchanging an OAuth token.
  // For that reason, we set a very low expiration (1min).
  token.setExpiration(new Date().getTime() + (60 * 1000));

  var authenticator = new stormpath.OAuthStormpathTokenAuthenticator(application);

  var options = {
    stormpath_token: token.compact()
  };

  authenticator.authenticate(options, function errorLogger() {
    if (arguments[0] !== null) {
      var logger = req.app.get('stormpathLogger');
      logger.info('Token exchange failed', arguments[0]);
    }
    callback.apply(null, arguments);
  });
};