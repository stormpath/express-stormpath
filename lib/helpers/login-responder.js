'use strict';

var createSession = require('./create-session');
var expandAccount = require('./expand-account');

module.exports = function(passwordGrantAuthenticationResult, account, req, res) {
  var accepts = req.accepts(['html','json']);
  var config = req.app.get('stormpathConfig');
  var postLoginHandler = config.postLoginHandler;
  var redirectUrl = config.web.login.nextUri;

  expandAccount(req.app,account,function(err,expandedAccount){
    req.user = expandedAccount;
    createSession(passwordGrantAuthenticationResult, expandedAccount, req, res);

    if (postLoginHandler) {
      return postLoginHandler(req.user, req, res, function() {
        if (accepts === 'json') {
          return res.end();
        }

        var url = req.query.next || redirectUrl;
        res.redirect(302, url);
      });
    }

    if (accepts === 'json') {
      return res.end();
    }

    var url = req.query.next || redirectUrl;
    res.redirect(302, url);
  });
};
