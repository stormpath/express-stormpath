'use strict';

var createSession = require('./create-session');
var expandAccount = require('./expand-account');
var url = require('url');

/**
 * If the request has the Accept header set to json, it will respond by just ending the response.
 * Else it will redirect to the configured url.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
function loginResponse(req, res) {
  var config = req.app.get('stormpathConfig');
  var accepts = req.accepts(['html', 'json']);
  var nextUrl = url.parse(req.query.next || '').path || config.web.login.nextUri;

  if (accepts === 'json') {
    return res.end();
  }

  res.redirect(302, nextUrl);
}

/**
 * Takes a password grant authentication result and an account together with an
 * http request and response and responds with a new session if successful.
 *
 * @method
 *
 * @param {Object} authenticationResult - The authentication result.
 * @param {Object} account - Account to log in.
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (authenticationResult, account, req, res) {
  var config = req.app.get('stormpathConfig');
  var postLoginHandler = config.postLoginHandler;

  expandAccount(req.app, account, function (err, expandedAccount) {
    req.user = expandedAccount;

    createSession(authenticationResult, expandedAccount, req, res);

    if (postLoginHandler) {
      postLoginHandler(req.user, req, res, function () {
        loginResponse(req, res);
      });
    } else {
      loginResponse(req, res);
    }
  });
};
