'use strict';

var Cookies = require('cookies');

/**
 * Creates a JWT, stores it in a cookie, and provides it on the request object
 * for other middleware to use.
 *
 * @param  {Object} authenticationResult From the Node SDK.
 * @param  {Object} req                  Express HTTP request.
 * @param  {Object} res                  Express HTTP response.
 */
module.exports = function (passwordGrantAuthenticationResult, account, req, res) {
  var accessTokenCookieConfig = req.app.get('stormpathConfig').web.accessTokenCookie;
  var refreshTokenCookieConfig = req.app.get('stormpathConfig').web.refreshTokenCookie;
  var cookies = new Cookies(req, res);

  res.locals.user = account;
  req.user = account;

  cookies.set(accessTokenCookieConfig.name, passwordGrantAuthenticationResult.accessToken, {
    domain: accessTokenCookieConfig.domain,
    expires: new Date(passwordGrantAuthenticationResult.accessToken.body.exp * 1000),
    httpOnly: accessTokenCookieConfig.httpOnly,
    path: accessTokenCookieConfig.path,
    secure: (accessTokenCookieConfig.https !== null ? accessTokenCookieConfig.https : (req.protocol === 'https'))
  });

  cookies.set(refreshTokenCookieConfig.name, passwordGrantAuthenticationResult.refreshToken, {
    domain: refreshTokenCookieConfig.domain,
    expires: new Date(passwordGrantAuthenticationResult.refreshToken.body.exp * 1000),
    httpOnly: refreshTokenCookieConfig.httpOnly,
    path: refreshTokenCookieConfig.path,
    secure: (refreshTokenCookieConfig.https !== null ? refreshTokenCookieConfig.https : (req.protocol === 'https'))
  });
};
