'use strict';

var Cookies = require('cookies');

var helpers = require('./helpers');

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
    if (req.accepts(['html', 'json']) === 'html') {
      var url = req.app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);
      res.redirect(302, url);
    } else {
      res.status(401).end();
    }
  } else {
    next();
  }
};

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
module.exports.groupsRequired = function(groups, all) {
  all = all === false ? false : true;

  return function(req, res, next) {
    var view = 'unauthorized';

    if (!req.user) {
      var url = req.app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);
      return res.redirect(302, url);
    }

    // If this user must be a member of all groups, we'll ensure that is the
    // case.
    var done = groups.length;
    var safe = false;

    req.user.getGroups(function(err, grps) {
      if (err) {
        req.app.get('stormpathLogger').info('Could not fetch user ' + req.user.email + '\'s groups.');
        return helpers.render(req, res, view);
      }

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
          helpers.render(req, res, view);
          req.app.get('stormpathLogger').info('User ' + req.user.email + ' attempted to access a protected endpoint but did not meet the group check requirements.');
        }
      });
    });
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
  // Wipe user data in case it was previously set by helpers.getUser().
  req.user = undefined;
  req.permissions = undefined;
  res.locals.user = undefined;
  res.locals.permissions = undefined;

  if (!req.headers.authorization) {
    req.app.get('stormpathLogger').info('User attempted to access a protected API endpoint with invalid credentials.');
    res.status(401).json({ error: 'Invalid API credentials.' });
  } else {
    req.app.get('stormpathApplication').authenticateApiRequest({ request: req }, function(err, authResult) {
      if (err) {
        req.app.get('stormpathLogger').info('Attempted to authenticate a user via the HTTP authorization header, but invalid credentials were supplied.');
        res.status(401).json({ error: 'Invalid API credentials.' });
      } else {
        authResult.getAccount(function(err, account) {
          if (err) {
            req.app.get('stormpathLogger').info('Attempted to retrieve a user\'s account, but this operation failed.');
            res.status(401).json({ error: 'Invalid API credentials.' });
            return;
          }

          helpers.expandAccount(req.app, account, function(err, expandedAccount) {
            if (err) {
              req.app.get('stormpathLogger').info('Attempted to expand a user\'s account, but this operation failed.');
              res.status(401).json({ error: 'Invalid API credentials.' });
              return;
            }

            res.locals.user = expandedAccount;
            res.locals.permissions = authResult.grantedScopes;
            req.user = expandedAccount;
            req.permissions = authResult.grantedScopes;

            return next();
          });
        });
      }
    });
  }
};

/**
 * Delete the token cookies that maintain a web session.
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.deleteCookies = function(req, res) {
  var cookies = new Cookies(req, res);
  var config = req.app.get('stormpathConfig');
  cookies.set('idSiteSession');
  cookies.set(config.web.accessTokenCookie.name);
  cookies.set(config.web.refreshTokenCookie.name);
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
    module.exports.deleteCookies(req,res);
    if (req.accepts(['html', 'json']) === 'html') {
      var url = req.app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);
      res.redirect(302, url);
    } else {
      res.status(401).json({ error: 'Invalid API credentials.' });
    }
  } else {
    next();
  }
};
