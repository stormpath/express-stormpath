'use strict';

var Cookies = require('cookies');
var parseIsoDuration = require('parse-iso-duration');

module.exports = function(account, req, res) {
  res.locals.user = account;
  req.user = account;
  var config = req.app.get('stormpathConfig');
  /*
    for this temporary id site session workaround, we will use
    the refresh token expiration as the max age of the session
   */
  var refreshTokenCookieConfig = config.web.refreshTokenCookie;
  var oAuthPolicy = config.application.oAuthPolicy;
  var cookies = new Cookies(req, res);
  cookies.set('idSiteSession', account.href, {
    secure: (refreshTokenCookieConfig.https !== null ? refreshTokenCookieConfig.https : (req.protocol === 'https')),
    domain: refreshTokenCookieConfig.domain,
    expires: new Date(new Date().getTime() + parseIsoDuration(oAuthPolicy.refreshTokenTtl)),
    path: refreshTokenCookieConfig.path,
    httpOnly: refreshTokenCookieConfig.httpOnly
  });
};
