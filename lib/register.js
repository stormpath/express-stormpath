'use strict';

var async = require('async');

var forms = require('./forms');
var helpers = require('./helpers');
var stormpath = require('stormpath');
var uuid = require('uuid');

var FIELDS = {
  'username': 'Username',
  'givenName': 'First Name',
  'middleName': 'Middle Name',
  'surname': 'Last Name',
  'email': 'Email',
  'password': 'Password',
  'confirmPassword': 'Confirm Password',
};

/**
 * Create a new Stomrpath user account, and render errors to the user if the
 * account couldn't be created for some reason.
 *
 * @method
 * @private
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {Object} form - The http form.
 *
 * @return {Function} Return a function which accepts an account hash and a
 *   callback.
 */
function createAccount(req, res) {
  var application = req.app.get('stormpathApplication');
  var logger = req.app.get('stormpathLogger');

  return function(account, callback) {
    application.createAccount(account, function(err, account) {
      if (err) {
        logger.info('A user tried to create a new account, but this operation failed with an error message: ' + err.developerMessage);
        callback(err);
      } else {
        res.locals.user = account;
        req.user = account;
        callback(null, account);
      }
    });
  };
}


function register(req, res) {
  var accepts = req.accepts(['html','json']);
  var application = req.app.get('stormpathApplication');
  var logger = req.app.get('stormpathLogger');
  var config = req.app.get('stormpathConfig');
  var view = config.web.register.view;
  var next = config.web.register.nextUri;
  var postRegistrationHandler = config.postRegistrationHandler;
  var authenticator = new stormpath.OAuthPasswordGrantRequestAuthenticator(application);

  // Handle incoming POST requests from an API-like clients (something like
  // Angular / React / REST).
  if (req.method === 'POST' && accepts === 'json') {
    helpers.validateAccount(req.body, config, function(errors) {
      if (errors) {
        return res.status(400).json({ error: errors[0].message });
      }

      application.createAccount(req.body, function(err, account) {
        if (err) {
          return res.status(400).json({ error: err.userMessage || err.message });
        }

        return res.json(account);
      });
    });

  // Handle incoming POST requests from an browser-like clients (something like
  // chrome / firefox / etc.).
  } else if (accepts === 'html') {
    if (config.web.spaRoot) {
      return res.sendFile(config.web.spaRoot);
    }

    forms.registrationForm.handle(req, {
      // If we get here, it means the user is submitting a registration request, so
      // we should attempt to validate the user's data and create their account.
      success: function(form) {
        async.waterfall([
          function(callback) {
            helpers.validateAccount(form.data, req.app.get('stormpathConfig'), function(errors) {
              if (errors) {
                logger.info(errors);
                return helpers.render(req, res, view, { error: errors[0].message, form: form });
              }

              return callback();
            });
          },

          // What we'll do here is simply set default values for `givenName` and
          // `surname`, because these value are annoying to set if you don't
          // care about them.  Eventually Stormpath is going to remove these
          // required fields, but for now this is a decent workaround to ensure
          // people don't have to deal with that stuff.
          function(callback) {
            if (!config || !config.web.register || !config.web.register.fields || !config.web.register.fields.givenName || (!config.web.register.fields.givenName.enabled && !form.data.givenName)) {
              form.data.givenName = 'Anonymous';
            }

            if (!config || !config.web.register || !config.web.register.fields || !config.web.register.fields.surname || (!config.web.register.fields.surname.enabled && !form.data.surname)) {
              form.data.surname = 'Anonymous';
            }

            callback(null, form.data);
          },
          createAccount(req, res, form),
        ], function(err, account) {
          if (err) {
            logger.info(err);
            helpers.render(req, res, view, { error: err.userMessage, form: form });

          // If the account is unverified, we'll show a special message to the
          // user on the login page.
          } else if (account.status === 'UNVERIFIED') {
            res.redirect(302, config.web.login.uri + '?status=unverified');
          } else if (config.web.register.autoAuthorize) {
            authenticator.authenticate({
              username: req.body.email || uuid(),
              password: req.body.password || uuid()
            }, function(err, passwordGrantAuthenticationResult) {
              if (err) {
                return res.status(400).json({ error: err.userMessage || err.message });
              }

              helpers.createSession(passwordGrantAuthenticationResult, account, req, res);
              if (postRegistrationHandler) {
                return postRegistrationHandler(req.user, req, res, function() {
                  res.redirect(302, req.query.next || next);
                });
              }

              res.redirect(302, req.query.next || next);
            });

          } else {
            res.redirect(302,config.web.login.uri+'?status=created');
          }
        });
      },

      // If we get here, it means the user didn't supply required form fields.
      error: function(form) {
        var formErrors = helpers.collectFormErrors(form);
        helpers.render(req, res, view, { form: form, formErrors: formErrors });
      },

      // If we get here, it means the user is doing a simple GET request, so we
      // should just render the registration template.
      empty: function(form) {
        helpers.render(req, res, view, { form: form });
      }
    });
  } else {
    res.status(415).end();
  }
}

module.exports = register;
