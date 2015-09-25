'use strict';

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
module.exports = function(req, res, next) {
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
