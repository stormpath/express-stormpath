'use strict';

var forms = require('../forms');
var helpers = require('../helpers');

/**
 * Allow a user to change his password.
 *
 * This can only happen if a user has reset their password, received the
 * password reset email, then clicked the link in the email which redirects them
 * to this controller.
 *
 * The URL this controller is bound to, and the view used to render this page
 * can all be controlled via express-stormpath settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {function} next - Callback to call next middleware.
 */
module.exports = function (req, res, next) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var sptoken = req.query.sptoken || req.body.sptoken;
  var view = config.web.changePassword.view;

  if (!sptoken) {
    return res.redirect(config.web.forgotPassword.uri);
  }

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return next();
      }

      application.verifyPasswordResetToken(sptoken, function (err, result) {
        if (err) {
          logger.info('A user attempted to reset their password with a token, but that token verification failed.');
          return helpers.writeJsonError(res, err);
        }

        // For GET requests, respond with 200 OK if the token is valid.
        if (req.method === 'GET') {
          return res.end();
        }

        result.password = req.body.password;

        return result.save(function (err) {
          if (err) {
            logger.info('A user attempted to reset their password, but the password change itself failed.');
            return helpers.writeJsonError(res, err);
          }

          res.end();
        });
      });
    },
    'text/html': function () {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return next();
      }

      helpers.render(req, res, view);
    }
  }, next);
};
