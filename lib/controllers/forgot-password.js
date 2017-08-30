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

        var email = req.body.email;

        forms.forgotPasswordForm.handle(req, {
          // If we get here, it means the user is submitting a password reset
          // request, so we should attempt to send the user a password reset email.
          success: function (form) {
            okta('GET', okta_url + '/api/v1/users/' + email, null, function(err, user_inquiry_resp, ui_body) {
              var ui_body = JSON.parse(ui_body);
              var err_code = ui_body && ui_body.errorCode;
              if (err_code && err_code == 'E0000007') {
                var email = form.data.email;
                sendMissingEmail(email, function(err, sfe_res) {
                  if (err)
                    logger.info('A user tried to reset their password, but supplied an invalid email address: ' + form.data.email + '.');

                  res.redirect(config.web.forgotPassword.nextUri);
                });
              }
              else {
                var email = form.data.email;
                var data = {email: email};

                if (req.organization)
                  data.accountStore = {href: req.organization.href};

                okta('POST', okta_url + '/api/v1/authn/recovery/password', JSON.stringify({username: email}), function(err, recover_password_res, rp_body) {
                  var recovery_token = JSON.parse(recover_password_res.body).recoveryToken;

                  sendForgotEmail(email, recovery_token, function(err, sfe_res) {
                    if (err)
                      logger.info('A user tried to reset their password, but supplied an invalid email address: ' + form.data.email + '.');

                    res.redirect(config.web.forgotPassword.nextUri);
                  });
                });
              }
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

var missing_body = 'We\'ve received a request to reset the password for this email address. ';
missing_body += 'But, we do not have a username with this email address on file. ';
missing_body += 'Please try again with another email. ';

function sendMissingEmail(email, callback) {
  sendEmail(email, 'Daycast Password Reset Attempt', missing_body, null, callback);
}

function okta(method, url, body, callback) {
  request({
    method: method,
    uri: url,
    headers: okta_headers,
    body: body
  }, function(err, resp, body) {
    if (!err && resp.statusCode > 200)
      err = new Error('Okta pwd recovery HTTP error ' + resp.statusCode + ': ' + (resp.body ? (resp.body.message || resp.body) : ''));

    callback(err, resp, body);
  });
}

var okta_headers = {
  'Accept': 'application/json',
  'Authorization': 'SSWS' + process.env.OKTA_APITOKEN,
  'Content-Type': 'application/json'
};

var forgot_body = 'We\'ve received a request to reset the password for this email address.';
forgot_body += 'To reset your password please click on this link or cut and paste this URL into your browser (link expires in 24 hours):  ';
forgot_body += server_url + '/change?';
forgot_body += 'sptoken={token}';
forgot_body += '&email={email}';
forgot_body += '<br>';
forgot_body += '<br>';
forgot_body += 'If you don\'t want to reset your password, please ignore this message. Your password will not be reset.';
forgot_body += '<br>';
forgot_body += '<br>';
forgot_body += '---------------------';
forgot_body += '<br>';
forgot_body += '<br>';
forgot_body += 'For general inquiries or to request support with your account, please email support@daycast.com';
forgot_body += '<br>';
forgot_body += '<br>';

function sendForgotEmail(email, token, callback) {
  var body = forgot_body.replace('{token}', qs_escape(token)).replace('{email}', qs_escape(email));
  sendEmail(email, 'Daycast Password Reset', body, callback);
}

function sendEmail(to_email, subject, body, callback) {
  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: {
      personalizations: [{
        to: [{email: to_email}],
        subject: subject
      }],
      from: {
        email: 'info@daycast.com'
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
