var stormpath = require('./index');


module.exports.loginRequired = function(req, res, next) {
  if (!res.locals.user) {
    var url = req.app.get('stormpathLoginUrl') + '?next=' + encodeURIComponent(req.route.path);
    res.redirect(302, url);
  } else {
    next();
  }
};
