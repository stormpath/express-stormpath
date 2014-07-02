var stormpath = require('./stormpath');


module.exports.loginRequired = function(req, res, next) {
  if (!res.locals.user) {
    var url = req.app.get('stormpathLoginUrl') + '?next=' + encodeURIComponent(req.route.path);
    res.redirect(302, url);
  } else {
    next();
  }
};


module.exports.groupsRequired = function(groups, all) {
  all = all === false ? false : true;

  return function(req, res, next) {
    // Ensure the user is logged in.
    if (!res.locals.user) {
      var url = req.app.get('stormpathLoginUrl') + '?next=' + encodeURIComponent(req.route.path);
      res.redirect(302, url);

    // If this user must be a member of all groups, we'll ensure that is the
    // case.
    } else {
      var done = groups.length;
      var safe = false;

      res.locals.user.getGroups(function(err, grps) {
        if (err) {
          res.redirect(302, req.app.get('stormpathLogoutUrl'));
        } else {
          // Iterate through each group on the user's account, checking to see
          // whether or not it's one of the required groups.
          grps.each(function(group, c) {
            if (groups.indexOf(group.name) > -1) {
              if (!all || --done === 0) {
                safe = true;
                next();
              }
            }
            c();
          },
          // If we get here, it means the user didn't meet the requirements,
          // so we'll log them out.
          function() {
            if (!safe) {
              res.redirect(302, req.app.get('stormpathLogoutUrl'));
            }
          });
        }
      });
    }
  };
};
