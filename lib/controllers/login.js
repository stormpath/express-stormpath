'use strict';

var _ = require('lodash');
var extend = require('deep-extend');
var stormpath = require('stormpath');
var url = require('url');

var forms = require('../forms');
var helpers = require('../helpers');
var oauth = require('../oauth');

/**
 * This controller logs in an existing user.  If there are any errors, an
 * error page is rendered.  If the process succeeds, the user will be logged in
 * and redirected.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res, next) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var nextUri = url.parse(req.query.next || '').path;

  res.locals.status = req.query.status;

  function authenticate(options, callback) {
    var authenticator = stormpath.OAuthPasswordGrantRequestAuthenticator(application);

    options = options || {};
    options.username = options.username || options.login || '';
    options.password = options.password || '';

    if (options.username === '' || options.password === '') {
      return callback(new Error('Invalid username or password.'));
    }

    authenticator.authenticate(options, function (err, authenticationResult) {
      if (err) {
        return callback(err);
      }

      authenticationResult.getAccount(function (err, account) {
        if (err) {
          logger.info('After successfully authenticating user, we were unable to retrieve the account details from Stormpath.');
          return callback(err);
        }

        helpers.loginResponder(authenticationResult, account, req, res);

        callback();
      });
    });
  }

  helpers.handleResponse(req, res, next, {
    'application/json': function () {
      var self = this;
      
      // If a GET request is made with the Accept header as json,
      // respond with the view model for this form.
      // TODO: When `stormpath.web.produces` is implemented,
      // this `if` must check that it is set to `application/json`.
      if (req.method === 'GET') {
        return helpers.getLoginViewModel(config, function (err, viewModel) {
          if (err) {
            return res.status(400).json({ error: err.userMessage || err.message });
          }

          res.status(200).json(viewModel);
        });
      }

      if (!this.isPostRequest()) {
        return self.pass();
      }

      if (!req.body) {
        return self.reject(new Error('Request requires that there is a body.'));
      }

      // Social login
      if (req.body.providerData) {
        return helpers.loginWithOAuthProvider(req.body, req, res);
      }

      authenticate(req.body, function (err) {
        if (err) {
          return self.reject(err);
        }

        self.accept();
      });
    },
    'text/html': function () {
      var self = this;

      if (req.user && config.web.login.enabled) {
        var nextUrl = nextUri || config.web.login.nextUri;
        res.redirect(302, nextUrl);
        return self.accept();
      }

      function renderForm(form, options) {
        if (options === undefined) {
          options = {};
        }

        var view = config.web.login.view;
        var oauthStateToken = oauth.common.resolveStateToken(req, res);
        var formActionUri = (config.web.login.uri + (nextUri ? ('?next=' + nextUri) : ''));

        var hasSocialProviders = _.some(config.socialProviders, function (socialProvider) {
          return socialProvider.enabled;
        });

        extend(options, {
          form: form,
          formActionUri: formActionUri,
          oauthStateToken: oauthStateToken,
          hasSocialProviders: hasSocialProviders
        });

        helpers.render(req, res, view, options);

        self.accept();
      }

      helpers.setTempCookie(res, 'oauthRedirectUri', req.originalUrl);

      forms.loginForm.handle(req, {
        // If we get here, it means the user is submitting a login request, so we
        // should attempt to log the user into their account.
        success: function (form) {
          authenticate(form.data, function (err) {
            if (err) {
              return renderForm(form, { error: err.userMessage });
            }

            self.accept();
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
  });
};
