'use strict';

module.exports = function(req, res, next) {
  var error = 'Invalid XSRF token';
  var token = req.headers['x-xsrf-token'] || (req.body && req.body.xsrfToken) || (req.query && req.query.xsrfToken);

  if(token===req.accessToken.body.xsrfToken){
    next();
  }else{
    if (req.accepts(['html', 'json']) === 'html') {
      var url = req.app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);
      res.locals.error = error;
      res.redirect(302, url);
    } else {
      res.status(401).json({ error: 'Invalid XSRF token' });
    }
  }
};
