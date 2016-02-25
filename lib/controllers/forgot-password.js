'use strict';

var forms = require('../forms');
var helpers = require('../helpers');

/**
 * This controller initializes the 'password reset' workflow for a user who has
 * forgotten his password.
 *
 * This will render a view, which prompts the user for their email address, then
 * sends a password reset email.
 *
 * The URL this controller is bound to, and the view used to render this page
 * can all be controlled via express-stormpath settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {function} next - The next callback.
 */
module.exports = function (req, res, next) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var view = config.web.forgotPassword.view;

  res.locals.status = req.query.status;

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      if (req.method !== 'POST') {
        return next();
      }

      return application.sendPasswordResetEmail(req.body.email, function (err) {
        if (err) {
          logger.info('A user tried to reset their password, but supplied an invalid email address: ' + req.body.email + '.');
        }

        res.end();
      });
    },
    'text/html': function () {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return next();
      }

      forms.forgotPasswordForm.handle(req, {
        // If we get here, it means the user is submitting a password reset
        // request, so we should attempt to send the user a password reset email.
        success: function (form) {
          application.sendPasswordResetEmail(form.data.email, function (err) {
            if (err) {
              logger.info('A user tried to reset their password, but supplied an invalid email address: ' + form.data.email + '.');
            }

            res.redirect(config.web.forgotPassword.nextUri);
          });
        },
        // If we get here, it means the user didn't supply required form fields.
        error: function (form) {
          // https://github.com/caolan/forms/issues/96
          if (req.query.status === 'invalid_sptoken') {
            return helpers.render(req, res, view, { form: form, status: req.query.status });
          }

          var formErrors = helpers.collectFormErrors(form);
          helpers.render(req, res, view, { form: form, formErrors: formErrors });
        },
        // If we get here, it means the user is doing a simple GET request, so we
        // should just render the forgot password template.
        empty: function (form) {
          helpers.render(req, res, view, { form: form });
        }
      });
    }
  }, next);
};
