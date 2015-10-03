'use strict';

var createSession = require('./create-session');
var createIdSiteSession = require('./create-id-site-session');

function loginResponse(req, res) {
  var config = req.app.get('stormpathConfig');
  var accepts = req.accepts(['html', 'json']);
  var redirectUrl = config.web.login.nextUri;
  var url = req.query.next || redirectUrl;

  if (accepts === 'json') {
    return res.end();
  }

  res.redirect(302, url);
}

module.exports = function(passwordGrantAuthenticationResult, account, req, res) {
  var config = req.app.get('stormpathConfig');
  var postLoginHandler = config.postLoginHandler;

  if (passwordGrantAuthenticationResult) {
    createSession(passwordGrantAuthenticationResult, account, req, res);
  } else {
    createIdSiteSession(account, req, res);
  }

  if (postLoginHandler) {
    postLoginHandler(req.user, req, res, function() {
      loginResponse(req, res);
    });
  } else {
    loginResponse(req, res);
  }
};
