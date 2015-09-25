'use strict';

var createSession = require('./create-session');

module.exports = function(passwordGrantAuthenticationResult, account, req, res) {
  var accepts = req.accepts(['html','json']);
  var config = req.app.get('stormpathConfig');
  var postLoginHandler = config.postLoginHandler;
  var redirectUrl = config.web.login.nextUri;

  createSession(passwordGrantAuthenticationResult,account,req,res);
  if (postLoginHandler) {
    postLoginHandler(req.user, req, res, function() {
      if( accepts === 'json'){
        res.end();
      }else{
        var url = req.query.next || redirectUrl;
        res.redirect(302, url);
      }
    });
  } else {
    if( accepts === 'json'){
      res.end();
    }else{
      var url = req.query.next || redirectUrl;
      res.redirect(302, url);
    }
  }
};
