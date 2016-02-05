'use strict';

var loginResponder = require('./login-responder');
var exchangeStormpathToken = require('./exchange-stormpath-token');

/**
 * loginWithOAuthProvider takes provider data, such as an access token,
 * and responds with a new session if the provider data is valid.
 *
 * @method
 *
 * @param {Object} options - Should contain the provider data sent to application.getAccount.
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function loginWithOAuthProvider(options, req, res) {
  var application = req.app.get('stormpathApplication');

  application.getAccount(options, function (err, providerAccountResult) {
    if (err) {
      return res.status(400).json({ error: err.userMessage || err.message });
    }

    var account = providerAccountResult.account;

    exchangeStormpathToken(req, account, function (err, authenticationResult) {
      if (err) {
        return res.status(400).json({ error: err.userMessage || err.message });
      }

      loginResponder(authenticationResult, account, req, res);
    });
  });
};
