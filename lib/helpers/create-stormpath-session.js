'use strict';

var createSession = require('./create-session');
var exchangeStormpathToken = require('./exchange-stormpath-token');

/**
 * Creates a Stormpath JWT, exchanges it for an OAuth token, and stores it in a cookie.
 *
 * @param  {Object} account              Account to create a session for.
 * @param  {Object} req                  Express HTTP request.
 * @param  {Object} res                  Express HTTP response.
 * @param  {function} callback           Callback to call once the token cookie(s) has been set.
 */
module.exports = function createStormpathSession(account, req, res, callback) {
  exchangeStormpathToken(req, account, function (err, authenticationResult) {
    if (err) {
      return callback(err);
    }

    createSession(authenticationResult, account, req, res);

    callback();
  });
};
