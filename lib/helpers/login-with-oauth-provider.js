'use strict';

var oauth = require('../oauth');
var writeJsonError = require('./write-json-error');
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

  // TODO: Add preLoginHandler support here
  application.getAccount(options, function (err, providerAccountResult) {
    if (err) {
      return oauth.errorResponder(req, res, err);
    }

    var account = providerAccountResult.account;

    exchangeStormpathToken(req, account, function (err, authResult) {
      if (err) {
        return writeJsonError(res, err);
      }

      // TODO: Add postLoginHandler support here
      loginResponder(authResult, account, req, res);
    });
  });
};
