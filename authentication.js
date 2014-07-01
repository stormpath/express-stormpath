var stormpath = require('./index');


module.exports.loginRequired = function(req, res, next) {
  if (!res.locals.user) {
    res.redirect(302, '/login');
  } else {
    next();
  }
};
