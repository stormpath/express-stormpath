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
module.exports = function(passwordGrantAuthenticationResult, account, req, res) {
  var accessTokenCookieConfig = req.app.get('stormpathConfig').web.accessTokenCookie;
  var refreshTokenCookieConfig = req.app.get('stormpathConfig').web.refreshTokenCookie;
  var cookies = new Cookies(req, res);

  res.locals.user = account;
  req.user = account;

  cookies.set(accessTokenCookieConfig.name, passwordGrantAuthenticationResult.accessToken, {
    secure: (accessTokenCookieConfig.https !== null ? accessTokenCookieConfig.https : (req.protocol === 'https')),
    domain: accessTokenCookieConfig.domain,
    expires: new Date(passwordGrantAuthenticationResult.accessToken.body.exp * 1000),
    path: accessTokenCookieConfig.path,
    httpOnly: accessTokenCookieConfig.httpOnly
  });

  cookies.set(refreshTokenCookieConfig.name, passwordGrantAuthenticationResult.refreshToken, {
    secure: (refreshTokenCookieConfig.https !== null ? refreshTokenCookieConfig.https : (req.protocol === 'https')),
    domain: refreshTokenCookieConfig.domain,
    expires: new Date(passwordGrantAuthenticationResult.refreshToken.body.exp * 1000),
    path: refreshTokenCookieConfig.path,
    httpOnly: refreshTokenCookieConfig.httpOnly
  });
};
