'use strict';

var helpers = require('../helpers');
var deleteCookies = require('./delete-cookies');

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
module.exports = function (req, res, next) {
  var logger = req.app.get('stormpathLogger');

  if (req.user) {
    return next();
  }

  logger.info('User attempted to access a protected endpoint with invalid credentials.');
  deleteCookies(req, res);

  if (req.accepts(['html', 'json']) === 'html') {
    var url = req.app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent(req.originalUrl);
    return res.redirect(302, url);
  }

  helpers.writeJsonError(res, { status: 401, message: 'Invalid API credentials.' });
};
