'use strict';

var Cookies = require('cookies');
var xtend = require('xtend');

/**
 * Creates a JWT, stores it in a cookie, and provides it on the request object
 * for other middleware to use.
 *
 * @param  {Object} authenticationResult From an authenticator in the Node SDK.
 * @param  {Object} account              Expanded Account object.
 * @param  {Object} req                  Express HTTP request.
 * @param  {Object} res                  Express HTTP response.
 */
module.exports = function (authenticationResult, account, req, res) {
  res.locals.user = req.user = account;

  var cookies = new Cookies(req, res);
  var isSecureRequest = req.protocol === 'https';
  var stormpathConfig = req.app.get('stormpathConfig');

  function setTokenCookie(token, cookieConfig) {
    var cookie = xtend(cookieConfig, {
      path: cookieConfig.path || '/',
      secure: cookieConfig.secure === null ? isSecureRequest : cookieConfig.secure
    });

    cookies.set(cookieConfig.name, token, cookie);
  }

  if (authenticationResult.access_token) {
    var accessTokenCookie = xtend({
      expires: new Date(new Date().getTime() + (authenticationResult.expires_in * 1000))
    }, stormpathConfig.web.accessTokenCookie);

    setTokenCookie(authenticationResult.access_token, accessTokenCookie);
  }

  if (authenticationResult.refresh_token) {
    setTokenCookie(authenticationResult.refresh_token, stormpathConfig.web.refreshTokenCookie);
  }
};
