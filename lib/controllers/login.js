'use strict';

var _ = require('lodash');
var extend = require('deep-extend');
var stormpath = require('stormpath');
var url = require('url');

var forms = require('../forms');
var helpers = require('../helpers');
var oauth = require('../oauth');

/**
 * Authenticate with a username and password.
 *
 * @method
 * @private
 *
 * @param {string} username - Username to authenticate with.
 * @param {string} password - Password to authenticate with.
 * @param {function} callback - Function to call when authenticated.
 */
function authenticate(application, credentials, callback) {
  var authenticator = stormpath.OAuthPasswordGrantRequestAuthenticator(application);

  credentials = credentials || {};
  credentials.username = credentials.login || credentials.username || '';
  credentials.password = credentials.password || '';

  if (!credentials.username || !credentials.password) {
    return callback(new Error('Invalid username or password.'));
  }

  authenticator.authenticate(credentials, function (err, authenticationResult) {
    if (err) {
      return callback(err);
    }

    authenticationResult.getAccount(function (err, account) {
      if (err) {
        return callback(err);
      }

      callback(null, {
        account: account,
        authenticationResult: authenticationResult
      });
    });
  });
}

/**
 * This controller logs in an existing user.  If there are any errors, an
 * error page is rendered.  If the process succeeds, the user will be logged in
 * and redirected.
 *
 * @method
 *
 * @param {Object} req - The HTTP request.
 * @param {Object} res - The HTTP response.
 * @param {function} next - The next function.
 */
module.exports = function (req, res, next) {
  var config = req.app.get('stormpathConfig');
  var application = req.app.get('stormpathApplication');

  res.locals.status = req.query.status;

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      switch (req.method) {
        case 'GET':
          helpers.getFormViewModel('login', config, function (err, viewModel) {
            if (err) {
              return helpers.writeJsonError(res, err);
            }

            res.json(viewModel);
          });
          break;

        case 'POST':
          if (!req.body) {
            return helpers.writeJsonError(res, new Error('Request requires that there is a body.'));
          }

          // Social login
          if (req.body.providerData) {
            return helpers.loginWithOAuthProvider(req.body, req, res);
          }

          authenticate(application, req.body, function (err, result) {
            if (err) {
              return helpers.writeJsonError(res, err);
            }

            helpers.loginResponder(result.authenticationResult, result.account, req, res);
          });
          break;

        default:
          next();
      }
    },
    'text/html': function () {

      var nextUri = url.parse(req.query.next || '').path;

      if (req.user && config.web.login.enabled) {
        var nextUrl = nextUri || config.web.login.nextUri;
        return res.redirect(302, nextUrl);
      }

      function renderForm(form, options) {
        if (options === undefined) {
          options = {};
        }

        var view = config.web.login.view;
        var oauthStateToken = oauth.common.resolveStateToken(req, res);
        var formActionUri = (config.web.login.uri + (nextUri ? ('?next=' + nextUri) : ''));

        var hasSocialProviders = _.some(config.web.social, function (socialProvider) {
          return socialProvider.enabled;
        });

        extend(options, {
          form: form,
          formActionUri: formActionUri,
          oauthStateToken: oauthStateToken,
          hasSocialProviders: hasSocialProviders
        });

        helpers.render(req, res, view, options);
      }

      helpers.setTempCookie(res, 'oauthRedirectUri', req.originalUrl);

      forms.loginForm.handle(req, {
        // If we get here, it means the user is submitting a login request, so we
        // should attempt to log the user into their account.
        success: function (form) {
          authenticate(application, form.data, function (err, result) {
            if (err) {
              return renderForm(form, { error: err.userMessage });
            }

            helpers.loginResponder(result.authenticationResult, result.account, req, res);
          });
        },
        // If we get here, it means the user didn't supply required form fields.
        error: function (form) {
          // Special case: if the user is being redirected to this page for the
          // first time, don't display any error.
          if (form.data && !form.data.login && !form.data.password) {
            return renderForm(form);
          }

          renderForm(form, { formErrors: helpers.collectFormErrors(form) });
        },
        // If we get here, it means the user is doing a simple GET request, so we
        // should just render the login template.
        empty: function (form) {
          renderForm(form);
        }
      });
    }
  }, next);
};
