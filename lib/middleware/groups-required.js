'use strict';

var helpers = require('../helpers');

/**
 * Assert that a user is a member of one or more groups before allowing the user
 * to continue. If the user is not logged in, they will be redirected to the
 * login page. If the user does not meet the group requirements, they will be
 * shown an unauthorized page letting them know they do not have the required
 * permissions.
 *
 * @param {String[]} groups - List of groups to assert membership for. Groups
 *   must be specified by group name.
 * @param {Boolean} [all=true] - Whether membership is required in one group or all.
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

    function redirectToLoginPage() {
      var url = config.web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);
      return res.redirect(302, url);
    }

    function isUserInGroups(callback) {
      var isInGroup = false;
      var done = groups.length;

      req.user.getGroups(function (err, userGroups) {
        if (err) {
          logger.info('Could not fetch user ' + req.user.email + '\'s groups.');
          return callback(null, false);
        }

        // Iterate through each group on the user's account, checking to see
        // whether or not it's one of the required groups.
        userGroups.each(
          function (group, iterateNext) {
            if (groups.indexOf(group.name) > -1) {
              if (!all || --done === 0) {
                isInGroup = true;
              }
            }
            iterateNext();
          },
          function () {
            callback(null, isInGroup);
          }
        );
      });
    }

    function handleJsonRequest() {
      if (!req.user) {
        return helpers.writeJsonError(res, new Error('You are not authenticated. Please log in to access this resource.'), 401);
      }

      isUserInGroups(function (err, isInGroup) {
        if (err) {
          return helpers.writeJsonError(res, new Error('An internal error occurred. Please contact support.'), 500);
        }

        if (!isInGroup) {
          return helpers.writeJsonError(res, new Error('You do not have sufficient permissions to access this resource.'), 403);
        }

        next();
      });
    }

    function handleTextHtmlRequest() {
      if (!req.user) {
        return redirectToLoginPage();
      }

      isUserInGroups(function (err, isInGroup) {
        if (err || !isInGroup) {
          res.status(403);
          return helpers.render(req, res, 'unauthorized');
        }

        next();
      });
    }

    helpers.handleAcceptRequest(req, res, {
      'text/html': handleTextHtmlRequest,
      'application/json': handleJsonRequest
    }, handleTextHtmlRequest);
  };
};
