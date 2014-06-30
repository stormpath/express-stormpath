var stormpath = require('stormpath');

var sp = require('./index');


module.exports.getUser = function(req, res) {
  if (req.session && req.session.user) {
    sp.client.getAccount(req.session.user.href, { expand: 'customData' }, function(err, account) {
      if (err) {
        req.session.reset();
      } else {
        req.session.user = account;
        res.locals.user = account;
      }
    });
  }
}
