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
      var view = config.web.verifyEmail.view;

      forms.resendAccountVerificationEmailForm.handle(req, {
        // If we get here, it means the user is submitting a request to resend their
        // account verification email, so we should attempt to send the user another
        // verification email.
        success: function (form) {
          application.resendVerificationEmail({ login: form.data.email }, function (err) {
            // Code 2016 means that an account does not exist for the given email
            // address.  We don't want to leak information about the account
            // list, so allow this continue without error.
            if (err && err.code !== 2016) {
              logger.info('A user tried to resend their account verification email, but failed: ' + err.message);
              return helpers.render(req, res, view, { error: err.message, form: form });
            }

            res.redirect(config.web.login.uri + '?status=unverified');
          });
        },
        // If we get here, it means the user didn't supply required form fields.
        error: function (form) {
          // The form library puts us in this error case if the form is empty,
          // which is true when you arrive on the form with a GET request.
          // This conditional allows us to control what we do in that situation
          if (form.data && !form.data.email) {
            client.getCurrentTenant(function (err, tenant) {
              if (err) {
                logger.info(err.message);
                return helpers.render(req, res, view, { error: err.userMessage, form: form });
              }

              tenant.verifyAccountEmail(req.query.sptoken, function (err, account) {
                if (err) {
                  logger.info(err.message);
                  return helpers.render(req, res, view, { form: form, invalid_sp_token: true });
                }

                client.getAccount(account.href, function (err) {
                  if (err) {
                    logger.info(err.message);
                    return helpers.render(req, res, view, { error: err.userMessage, form: form });
                  }

                  res.redirect(config.web.login.uri + '?status=verified');
                });
              });
            });
          } else {
            var formErrors = helpers.collectFormErrors(form);
            helpers.render(req, res, view, { form: form, formErrors: formErrors });
          }
        },
        // If we get here, it means the user is doing a simple GET request, so we
        // should just render the template.
        empty: function (form) {
          helpers.render(req, res, view, { form: form });
        }
      });
    }
  }, next);
};
