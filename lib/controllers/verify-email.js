'use strict';

var forms = require('../forms');
var helpers = require('../helpers');

/**
 * This controller either  prompts a user to 'resend' their account verification email,
 * or verifies the sptoken in the URL that the user has arrived with
 *
 * This can only happen if a user has registered with the account verification
 * workflow enabled, and then clicked the link in their email which redirects
 * them to this controller.
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
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      switch (req.method) {
        case 'POST':
          application.resendVerificationEmail({ login: req.body.login }, function (err) {
            // Code 2016 means that an account does not exist for the given email
            // address.  We don't want to leak information about the account list,
            // so allow this continue without error.
            if (err && err.code !== 2016) {
              logger.info('A user tried to resend their account verification email, but failed: ' + err.message);
              return helpers.writeJsonError(res, err);
            }

            res.end();
          });
          break;

        case 'GET':
          client.getCurrentTenant(function (err, tenant) {
            if (err) {
              logger.info(err.message);
              return helpers.writeJsonError(res, err);
            }

            tenant.verifyAccountEmail(req.query.sptoken, function (err) {
              if (err) {
                logger.info(err.message);
                return helpers.writeJsonError(res, err);
              }

              res.end();
            });
          });
          break;

        default:
          next();
      }
    },
    'text/html': function () {
      helpers.render(req, res, config.web.verifyEmail.view);
    }
  }, next);
};
