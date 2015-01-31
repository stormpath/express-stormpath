'use strict';


var helpers = require('./helpers');
var stormpath = require('./stormpath');


/**
 * This callback, when called, will simply continue processing the HTTP
 * request.
 *
 * @callback nextCallback
 */


/**
 * Assert that a user is logged into an account before allowing the user to
 * continue.  If the user is not logged in, they will be redirected to the login
 * page.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {nextCallback} next - The callback which is called to continue
 *   processing the request if the user is authenticated.
 */
module.exports.loginRequired = function(req, res, next) {
  if (!req.user) {
    var url = req.app.get('stormpathLoginUrl') + '?next=' + encodeURIComponent(req.originalUrl.split('?')[0]);
    res.redirect(302, url);
  } else {
    next();
  }
};


/**
 * Assert that a user is a member of one or more groups before allowing the user
 * to continue.  If the user is not logged in, or does not meet the group
 * requirements, they will be redirected to the login page.
 *
 * @method
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
module.exports.groupsRequired = function(groups, all) {
  all = all === false ? false : true;

  return function(req, res, next) {
    // Ensure the user is logged in.
    if (!req.user) {
      var url = req.app.get('stormpathLoginUrl') + '?next=' + encodeURIComponent(req.originalUrl.split('?')[0]);
      res.redirect(302, url);

    // If this user must be a member of all groups, we'll ensure that is the
    // case.
    } else {
      var done = groups.length;
      var safe = false;

      req.user.getGroups(function(err, grps) {
        if (err) {
          helpers.render(req.app.get('stormpathUnauthorizedView'), res);
          req.app.get('stormpathLogger').info('Could not fetch user ' + req.user.email + '\'s groups.');
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
          // so we'll send them to the login page with the ?next querystring set.
          function() {
            if (!safe) {
              helpers.render(req.app.get('stormpathUnauthorizedView'), res);
              req.app.get('stormpathLogger').info('User ' + req.user.email + ' attempted to access a protected endpoint but did not meet the group check requirements.');
            }
          });
        }
      });
    }
  };
};


/**
 * Assert that a user has specified valid API credentials before allowing them
 * to continue.  If the user's credentials are invalid, a 401 will be returned
 * along with an appropriate error message.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {nextCallback} next - The callback which is called to continue
 *   processing the request if the user is authenticated.
 */
module.exports.apiAuthenticationRequired = function(req, res, next) {
  if (!req.user) {
    req.app.get('stormpathLogger').info('User attempted to access a protected API endpoint with invalid credentials.');
    res.status(401).json({ error: 'Invalid API credentials.' });
  } else {
    next();
  }
};


/**
 * Assert that a user is logged into an account before allowing the user to
 * continue.  If the user is not logged in, they will be redirected to the login
 * page.  This method allows the user to authenticate ANY WAY THEY WISH, and
 * responds appropriately given the Accept type of the client.  This is useful
 * for SPA type applications.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {nextCallback} next - The callback which is called to continue
 *   processing the request if the user is authenticated.
 */
module.exports.authenticationRequired = function(req, res, next) {
  if (!req.user) {
    req.app.get('stormpathLogger').info('User attempted to access a protected endpoint with invalid credentials.');
    if (req.accepts(['html', 'json']) === 'html') {
      var url = req.app.get('stormpathLoginUrl') + '?next=' + encodeURIComponent(req.originalUrl.split('?')[0]);
      res.redirect(302, url);
    } else {
      res.status(401).json({ error: 'Invalid API credentials.' });
    }
  } else {
    next();
  }
};
