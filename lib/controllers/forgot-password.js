'use strict';

var forms = require('../forms');
var helpers = require('../helpers');
var urls = helpers.daycastConfig().site_urls;
var qs_escape = require('querystring').escape;
var request = require('request');
var okta_url = process.env.OKTA_ORG.replace(/\/$/, '');
var server_url = process.env.SERVER_URL.replace(/\/$/, '');
var child_process = require('child_process');

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
  var USER_AGENT = req.headers['user-agent'];
  var IP_ADDRESS = req.headers['x-real-ip'] || xForwardedForClientIP(req.headers['x-forwarded-for']) || req.connection.remoteAddress;
  if (/:{1,2}(ffff)?:(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/g.test(IP_ADDRESS))
    IP_ADDRESS = IP_ADDRESS.replace(/^.*:/, ''); // strip to ipv4 if IPv4-mapped IPv6 address format

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

                  sendForgotEmail(email, recovery_token, IP_ADDRESS, USER_AGENT, function(err, sfe_res) {
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
              organization: req.organization,
              isApp: helpers.isApp(req)
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
            helpers.render(req, res, view, { form: form, organization: req.organization, isApp: helpers.isApp(req) });
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

var link = server_url + '/change?sptoken={token}&email={email}'

function sendForgotEmail(email, token, IP_ADDRESS, USER_AGENT, callback) {
  var reset_link = link.replace('{token}', qs_escape(token)).replace('{email}', qs_escape(email));
  getTokenTimeout(function(token_lifetime) {
    sendEmail(email, 'Reset Your Daycast Password', reset_link, token_lifetime, IP_ADDRESS, USER_AGENT, callback);
  });
}

function getTokenTimeout(callback) {
  okta('GET', okta_url + '/api/v1/policies?type=PASSWORD', null, function(err, resp, body) {
    var resp_body = JSON.parse(body);
    var stormpath_policy = resp_body.find(function(policy){return policy.name == 'Default Policy'});
    var token_lifetime = stormpath_policy.settings.recovery.factors.okta_email.properties.recoveryToken.tokenLifetimeMinutes;
    callback && callback(token_lifetime);
  });
}

function getOSPrettyName(ua) {
  if (/like Mac OS X/.test(ua)) {
    if (/iPhone/.test(ua))
      return 'iPhone';
    if (/iPad/.test(ua))
      return 'iPad';
  }

  if (/Android/.test(ua))
    return 'Android';

  if (/webOS\//.test(ua))
    return 'webOS';

  if (/(Intel|PPC) Mac OS X/.test(ua))
    return 'macOS';

  if (/Windows NT/.test(ua))
    return 'Windows';

  return 'Unknown';
}

function xForwardedForClientIP(header) {
  if (!header)
    return;

  var split = header.split(', ');
  var client_ip = split[0];
  return client_ip;
}

function sendEmail(to_email, subject, reset_link, token_lifetime, IP_ADDRESS, USER_AGENT, callback) {
  var api_key = process.env.MANDRILL_API_KEY;
  var base_url = process.env.MANDRILL_API_URL;

  var os_pretty_name = getOSPrettyName(USER_AGENT);

  var path = '/messages/send-template.json';
  var opts = {uri: base_url + path, method: 'post', json: true};
  opts.body = {
    key: api_key,
    template_name: 'PasswordReset',
    template_content: [
      {
        name: 'name',
        content: 'content'
      }
    ],
    message: {
      subject: subject,
      from_email: 'info@daycast.com',
      from_name: 'Daycast',
      to: [
        {
          email: to_email,
          type: 'to'
        }
      ],
      headers: {
        'Reply-To': 'info@daycast.com'
      },
      merge: true,
      merge_language: 'mailchimp',
      global_merge_vars: [
        {
          name: 'forgot_password_link',
          content: reset_link
        },
        {
          name: 'reset_password_link',
          content: reset_link
        },
        {
          name: 'operating_system',
          content: os_pretty_name
        },
        {
          name: 'reset_window',
          content: token_lifetime / 60
        },
        {
          name: 'ip_address',
          content: IP_ADDRESS
        }
      ]
    }
  };

  request(opts, function(err, res, data) {
    if (!err && res.statusCode >= 300)
      err = new Error('HTTP Error ' + res.statusCode);
    if (err) return callback(err, data);
    callback(null, data);
  }).auth('anystring', api_key, true);
}
