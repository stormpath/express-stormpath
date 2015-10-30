'use strict';

var helpers = require('../helpers');

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

    helpers.loginResponder(undefined, providerAccountResult.account, req, res);
  });
};
