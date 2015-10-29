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
 */
module.exports = function (req, res) {
  var accepts = req.accepts(['html', 'json']);
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var sptoken = req.query.sptoken || req.body.sptoken;
  var view = config.web.changePassword.view;

  if (!sptoken) {
    return res.redirect(config.web.forgotPassword.uri);
  }

  application.verifyPasswordResetToken(sptoken, function (err, result) {
    if (err) {
      logger.info('A user attempted to reset their password with a token, but that token verification failed.');

      if (accepts === 'json') {
        return res.status(400).json({ error: err.userMessage || err.message });
      }

      return res.redirect(config.web.changePassword.errorUri);
    }

    if (req.method === 'POST' && accepts === 'json') {
      result.password = req.body.password;
      return result.save(function (err) {
        if (err) {
          logger.info('A user attempted to reset their password, but the password change itself failed.');
          return res.status(400).json({ error: err.userMessage || err.message });
        }

        res.end();
      });
    }

    forms.changePasswordForm.handle(req, {
      // If we get here, it means the user is submitting a password change
      // request, so we should attempt to change the user's password.
      success: function (form) {
        if (form.data.password !== form.data.passwordAgain) {
          return helpers.render(req, res, view, { error: 'Passwords do not match.', form: form });
        }

        result.password = form.data.password;
        result.save(function (err) {
          if (err) {
            logger.info('A user attempted to reset their password, but the password change itself failed.');
            return helpers.render(req, res, view, { error: err.userMessage, form: form });
          }

          if (config.web.changePassword.autoLogin) {
            res.locals.user = result.account;
            req.user = result.account;
            return res.redirect(config.web.login.nextUri);
          }

          res.redirect(config.web.changePassword.nextUri);
        });
      },
      // If we get here, it means the user didn't supply required form fields.
      error: function (form) {
        // Special case: if the user is being redirected to this page for the
        // first time, don't display any error.
        if (form.data && !form.data.password && !form.data.passwordAgain) {
          return helpers.render(req, res, view, { form: form });
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
  });
};
