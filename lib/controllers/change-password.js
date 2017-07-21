'use strict';

var forms = require('../forms');
var helpers = require('../helpers');
var oktaErrorTransformer = require('../okta/error-transformer');

/**
 * Uses the AuthN API to complete a password reset workflow.
 *
 * Use application.sendPasswordResetEmail() to get recoveryTokenResponse
 *
 * @param {*} client stormpath client instance
 * @param {*} recoveryTokenResource the response from /authn/recovery/password
 * @param {*} newPassword new password that the end-user has provided
 * @param {*} callback
 */
function resetPasswordWithRecoveryToken(client, recoveryTokenResource, newPassword, callback) {

  var userHref = '/users/' + recoveryTokenResource._embedded.user.id;

  client.getAccount(userHref, function (err, account) {

    if (err) {
      return callback(err);
    }

    var href = '/authn/recovery/answer';
    var body = {
      stateToken: recoveryTokenResource.stateToken,
      answer: account.profile.stormpathMigrationRecoveryAnswer
    };

    client.createResource(href, body, function (err, result) {

      if (err) {
        return callback(err);
      }

      var href = '/authn/credentials/reset_password';
      var body = {
        stateToken: result.stateToken,
        newPassword: newPassword
      };

      client.createResource(href, body, callback);

    });
  });
}

/**
 * Allow a user to change their password.
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
  var client = req.app.get('stormpathClient');
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
          err = oktaErrorTransformer(err);
          return helpers.writeJsonError(res, err);
        }

        // For GET requests, respond with 200 OK if the token is valid.
        if (req.method === 'GET') {
          return res.end();
        }

        return resetPasswordWithRecoveryToken(client, result, req.body.password, function (err) {
          if (err) {
            logger.info('A user attempted to reset their password, but the password change itself failed.');
            err = oktaErrorTransformer(err);
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

      var formActionUri = config.web.changePassword.uri
        + '?sptoken=' + encodeURIComponent(req.query.sptoken);

      return helpers.organizationResolutionGuard(req, res, formActionUri, function () {
        application.verifyPasswordResetToken(sptoken, function (err, result) {
          if (err) {
            logger.info('A user attempted to reset their password with a token, but that token verification failed.');
            return res.redirect(config.web.changePassword.errorUri);
          }

          forms.changePasswordForm.handle(req, {
            // If we get here, it means the user is submitting a password change
            // request, so we should attempt to change the user's password.
            success: function (form) {
              var viewData = {
                form: form,
                organization: req.organization
              };

              if (form.data.password !== form.data.passwordAgain) {
                viewData.error = 'Passwords do not match.';
                return helpers.render(req, res, view, viewData);
              }

              result.password = form.data.password;

              return resetPasswordWithRecoveryToken(client, result, form.data.password, function (err) {
                if (err) {
                  logger.info('A user attempted to reset their password, but the password change itself failed.');
                  err = oktaErrorTransformer(err);
                  viewData.error = err.userMessage;
                  return helpers.render(req, res, view, viewData);
                }

                if (config.web.changePassword.autoLogin) {
                  var options = {
                    username: result.email,
                    password: result.password
                  };

                  if (req.organization) {
                    options.accountStore = req.organization.href;
                  }

                  return helpers.authenticate(options, req, res, function (err) {
                    if (err) {
                      viewData.error = err.userMessage;
                      return helpers.render(req, res, view, viewData);
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
                return helpers.render(req, res, view, { form: form, organization: req.organization });
              }

              var formErrors = helpers.collectFormErrors(form);
              helpers.render(req, res, view, { form: form, formErrors: formErrors });
            },
            // If we get here, it means the user is doing a simple GET request, so we
            // should just render the forgot password template.
            empty: function (form) {
              helpers.render(req, res, view, { form: form, organization: req.organization });
            }
          });
        });
      });
    }
  }, next);
};
