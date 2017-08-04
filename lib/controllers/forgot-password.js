'use strict';

var forms = require('../forms');
var helpers = require('../helpers');
var urls = helpers.daycastConfig().site_urls;
var qs_escape = require('querystring').escape;
var request = require('request');
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
var okta_url = process.env.OKTA_ORG.replace(/\/$/, '');
var server_url = process.env.SERVER_URL.replace(/\/$/, '');

/**
 * This controller initializes the 'password reset' workflow for a user who has
 * forgotten their password.
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
      if (!helpers.isApp(req) && !helpers.allowBrowser(req, res))
        return res.redirect(urls.download + '?from=forgot');

      if (req.method !== 'GET' && req.method !== 'POST') {
        return next();
      }

      var formActionUri = config.web.forgotPassword.uri;

      return helpers.organizationResolutionGuard(req, res, formActionUri, function () {
        forms.forgotPasswordForm.handle(req, {
          // If we get here, it means the user is submitting a password reset
          // request, so we should attempt to send the user a password reset email.
          success: function (form) {
            var data = {
              email: form.data.email
            };

            if (req.organization) {
              data.accountStore = {
                href: req.organization.href
              };
            }

            var email = form.data.email;
            var opts = {
              body: JSON.stringify({username: email}),
              headers: {
                'Accept': 'application/json',
                'Authorization': 'SSWS' + process.env.OKTA_APITOKEN,
                'Content-Type': 'application/json'
              },
              method: 'POST',
              url: okta_url + '/api/v1/authn/recovery/password',
            };

            request.post(opts, function(err, recover_password_res) {
              if (!err && recover_password_res.statusCode != 200)
                err = new Error(res.body.message);

              if (err) return error(res, err);

              var recovery_token = JSON.parse(recover_password_res.body).recoveryToken;

              sendForgotEmail(email, recovery_token, function(err, sfe_res) {
                if (err) {
                  logger.info('A user tried to reset their password, but supplied an invalid email address: ' + form.data.email + '.');
                }

                res.redirect(config.web.forgotPassword.nextUri);
              });
            });
          },
          // If we get here, it means the user didn't supply required form fields.
          error: function (form) {

            var viewData = {
              form: form,
              organization: req.organization
            };

            // https://github.com/caolan/forms/issues/96
            if (req.query.status === 'invalid_sptoken') {
              viewData.status = req.query.status;
              return helpers.render(req, res, view, viewData);
            }

            viewData.formErrors = helpers.collectFormErrors(form);
            helpers.render(req, res, view, viewData);
          },
          // If we get here, it means the user is doing a simple GET request, so we
          // should just render the forgot password template.
          empty: function (form) {
            helpers.render(req, res, view, { form: form, organization: req.organization });
          }
        });
      });
    }
  }, next);
};

function sendForgotEmail(email, token, callback) {
  var subject = 'Daycast Password Reset';
  var body = 'We\'ve received a request to reset the password for this email address.';
  body += 'To reset your password please click on this link or cut and paste this URL into your browser (link expires in 24 hours):  ';
  body += server_url + '/change';
  body += '&sptoken=' + qs_escape(token);
  body += '&email=' + qs_escape(email);
  body += '<br>';
  body += '<br>';
  body += 'If you don\'t want to reset your password, please ignore this message. Your password will not be reset.';
  body += '<br>';
  body += '<br>';
  body += '---------------------';
  body += '<br>';
  body += '<br>';
  body += 'For general inquiries or to request support with your account, please email support@daycast.com';
  body += '<br>';
  body += '<br>';

  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: {
      personalizations: [{
        to: [{email: email}],
        subject: subject
      }],
      from: {
        email: 'support@daycast.com'
      },
      content: [{
        type: 'text/html',
        value: body
      }]
    }
  });

  sg.API(request, function(err, response) {
    if (err) console.error(err.response.body.errors);

    if (callback) callback(null, response);
  });
}
