'use strict';

var helpers = require('../helpers');

/**
 * Assert that a user is a member of one or more groups before allowing the user
 * to continue.  If the user is not logged in, they will be redirected to the
 * login page.  If the user does not meet the group requirements, they will be
 * shown an unauthorized page letting them know they do not have the required
 * permissions.
 *
 * @param {String[]} groups - A list of groups to assert membership in.  Groups
 *   must be specified by group name.
 * @param {Boolean} [all=true] - Should we assert the user is a member of all groups,
 *   or just one?
 *
 * @returns {Function} Returns an express middleware which asserts a user's
 *   group membership, and only allows the user to continue if the assertions
 *   are true.
 */
module.exports = function (groups, all) {
  all = all === false ? false : true;

  return function (req, res, next) {
    var config = req.app.get('stormpathConfig');
    var logger = req.app.get('stormpathLogger');
    var view = 'unauthorized';

    if (!req.user) {
      var url = config.web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);
      return res.redirect(302, url);
    }

    // If this user must be a member of all groups, we'll ensure that is the
    // case.
    var done = groups.length;
    var safe = false;

    req.user.getGroups(function (err, grps) {
      if (err) {
        logger.info('Could not fetch user ' + req.user.email + '\'s groups.');
        return helpers.render(req, res, view);
      }

      // Iterate through each group on the user's account, checking to see
      // whether or not it's one of the required groups.
      grps.each(function (group, c) {
        if (groups.indexOf(group.name) > -1) {
          if (!all || --done === 0) {
            safe = true;
            next();
          }
        }
        c();
      },
      // If we get here, it means the user didn't meet the requirements,
      // so we'll send them to the login page with the ?next querystring set.
      function () {
        if (!safe) {
          logger.info('User ' + req.user.email + ' attempted to access a protected endpoint but did not meet the group check requirements.');
          helpers.render(req, res, view);
        }
      });
    });
  };
};
