'use strict';

var Cookies = require('cookies');

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
  res.locals.user = account;
  req.user = account;

  var cookies = new Cookies(req, res);
  var isSecureRequest = req.protocol === 'https';
  var stormpathConfig = req.app.get('stormpathConfig');

  function setTokenCookie(token, cookieConfig) {
    cookies.set(cookieConfig.name, token, {
      domain: cookieConfig.domain,
      expires: new Date(token.body.exp * 1000),
      httpOnly: cookieConfig.httpOnly,
      path: cookieConfig.path || '/',
      secure: cookieConfig.secure === null ? isSecureRequest : cookieConfig.secure
    });
  }

  if (authenticationResult.accessToken) {
    setTokenCookie(authenticationResult.accessToken, stormpathConfig.web.accessTokenCookie);
  }

  if (authenticationResult.refreshToken) {
    setTokenCookie(authenticationResult.refreshToken, stormpathConfig.web.refreshTokenCookie);
  }
};
