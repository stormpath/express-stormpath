'use strict';

var forms = require('../forms');
var helpers = require('../helpers');
var cfg = helpers.daycastConfig();
var urls = cfg.site_urls;
var email_groups = cfg.mailchimp_list.interests;

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
  var action = req.query.action;
  var view = config.web.changePassword.view;
  var user = {
    email: req.query.email,
    fname: req.query.fname,
    lname: req.query.lname
  };

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

      application.verifyPasswordResetToken(sptoken, function (err, result) {
        if (err) {
          logger.info('A user attempted to reset their password with a token, but that token verification failed.');
          return res.redirect(config.web.changePassword.errorUri);
        }

        var form = action == 'invite' ? forms.inviteeForm : forms.changePasswordForm;

        form.handle(req, {
          // If we get here, it means the user is submitting a password change
          // request, so we should attempt to change the user's password.
          success: function (form) {
            if (form.data.password !== form.data.passwordAgain) {
              return helpers.render(req, res, view, { error: 'Passwords do not match.', form: form, urls: urls, user: user, email_groups: email_groups });
            }

            result.password = form.data.password;

            result.save(function (err) {
              if (err) {
                logger.info('A user attempted to reset their password, but the password change itself failed.');
                return helpers.render(req, res, view, { error: err.userMessage, form: form, urls: urls, user: user, email_groups: email_groups });
              }

              if (!helpers.isApp(req) && !helpers.allowBrowser(req, res))
                return helpers.render(req, res, view, {status: "success-in-browser", form: form, action: action, urls: urls, user: user, email_groups: email_groups });

              if (config.web.changePassword.autoLogin) {
                var options = {
                  username: result.email,
                  password: result.password,
                  email_interests: req.body.email_interests
                };

                return helpers.authenticate(options, req, res, function (err) {
                  if (err) {
                    return helpers.render(req, res, view, { error: err.userMessage, form: form, urls: urls, user: user, email_groups: email_groups });
                  }

                  res.redirect(config.web.login.nextUri);
                });
              }

              res.redirect(config.web.changePassword.nextUri);
            });
          },
          // If we get here, it means the user didn't supply required form fields.
          error: function (form) {
            // Special case: if the user is being redirected to this page for the
            // first time, don't display any error.
            if (form.data && !form.data.password && !form.data.passwordAgain) {
              return helpers.render(req, res, view, { form: form, action: action, urls: urls, user: user, email_groups: email_groups });
            }

            var formErrors = helpers.collectFormErrors(form);
            helpers.render(req, res, view, { form: form, formErrors: formErrors, urls: urls, user: user, email_groups: email_groups });
          },
          // If we get here, it means the user is doing a simple GET request, so we
          // should just render the forgot password template.
          empty: function (form) {
            helpers.render(req, res, view, { form: form, urls: urls, user: user, email_groups: email_groups });
          }
        });
      });
    }
  }, next);
};
