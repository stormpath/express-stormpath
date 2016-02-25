'use strict';

var writeJsonError = require('./write-json-error');

module.exports = function (req, res, next) {
  var error = 'Invalid XSRF token';
  var token = req.headers['x-xsrf-token'] || (req.body && req.body.xsrfToken) || (req.query && req.query.xsrfToken);

  if (token === req.accessToken.body.xsrfToken) {
    return next();
  }

  if (req.accepts(['html', 'json']) === 'html') {
    var url = req.app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);

    res.locals.error = error;
    return res.redirect(302, url);
  }

  writeJsonError(res, { status: 401, message: 'Invalid XSRF token' });
};
