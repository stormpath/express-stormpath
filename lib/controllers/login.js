'use strict';

var extend = require('deep-extend');
var stormpath = require('stormpath');
var uuid = require('uuid');

var forms = require('../forms');
var helpers = require('../helpers');
var oauth = require('../oauth');
var loginWithOAuthProvider = require('../helpers/login-with-oauth-provider');

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
module.exports = function (req, res) {
  var accepts = req.accepts(['html', 'json']);
  var application = req.app.get('stormpathApplication');
  var authenticator = stormpath.OAuthPasswordGrantRequestAuthenticator(application);
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var nextUri = req.query.next;
  var formActionUri = (config.web.login.uri + (nextUri ? ('?next=' + nextUri) : ''));
  var view = req.app.get('stormpathConfig').web.login.view;
  var oauthStateToken = null;
  var providerData = req.body && req.body.providerData;

  function renderForm(form, options) {
    if (options === undefined) {
      options = {};
    }

    extend(options, {
      form: form,
      formActionUri: formActionUri,
      oauthStateToken: oauthStateToken
    });

    helpers.render(req, res, view, options);
  }

  if (req.user && config.web.login.enabled) {
    var url = nextUri || config.web.login.nextUri;
    return res.redirect(302, url);
  }

  res.locals.status = req.query.status;

  if (req.method === 'POST' && accepts === 'json') {
    if (providerData) {
      // Social Login
      var options = {
        providerData: {
          providerId: providerData.providerId,
          accessToken: providerData.accessToken,
          code: providerData.code
        }
      };

      return loginWithOAuthProvider(options, req, res);
    }

    authenticator.authenticate({
      username: req.body.username || uuid(),
      password: req.body.password || uuid()
    }, function (err, passwordGrantAuthenticationResult) {
      if (err) {
        return res.status(400).json({ error: err.userMessage || err.message });
      }

      passwordGrantAuthenticationResult.getAccount(function (err, account) {
        if (err) {
          logger.info('After successfully authenticating user ' + account.email + ', we were unable to retrieve the account details from Stormpath.');
          return res.status(400).json({ error: err.userMessage || err.message });
        }

        helpers.loginResponder(passwordGrantAuthenticationResult, account, req, res);
      });
    });
  } else if (accepts === 'html') {
    if (config.web.spaRoot) {
      return res.sendFile(config.web.spaRoot);
    }

    oauthStateToken = oauth.common.resolveStateToken(req, res);
    helpers.setTempCookie(res, 'oauthRedirectUri', req.originalUrl);

    forms.loginForm.handle(req, {
      // If we get here, it means the user is submitting a login request, so we
      // should attempt to log the user into their account.
      success: function (form) {
        authenticator.authenticate({
          username: form.data.login,
          password: form.data.password
        }, function (err, passwordGrantAuthenticationResult) {
          if (err) {
            logger.info('User attempted to authenticated via the login page, but supplied invalid credentials.');
            return renderForm(form, { error: err.userMessage });
          }

          passwordGrantAuthenticationResult.getAccount(function (err, account) {
            if (err) {
              logger.info('After successfully authenticating user ' + account.email + ', we were unable to retrieve the account details from Stormpath.');
              return renderForm(form, { error: err.userMessage });
            }

            helpers.loginResponder(passwordGrantAuthenticationResult, account, req, res);
          });
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
};
