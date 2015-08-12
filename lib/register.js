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
        // helpers.render(view, res, { error: err.userMessage, form: form });
        logger.info('A user tried to create a new account, but this operation failed with an error message: ' + err.developerMessage);
        callback(err);
      } else {
        // helpers.render(view, res, { email: acc.email });
      // } else {
        res.locals.user = account;
        req.user = account;
        callback(null,account);
      }
    });
  };
}


/**
 * Build an account hash by inspecting the user submitted form, and retrieving
 * all data.
 *
 * @method
 * @private
 *
 * @param {Object} req - The http request.
 * @param {Object} form - The http form.
 *
 * @return {Function} Returns a function which accepts a callback.
 */
function buildAccount(req, form) {
  var account = {};

  return function(callback) {
    async.each(Object.keys(FIELDS), function(key, next) {
      account[key] = form.data[key];
      next();
    }, function(err) {
      if (err) {
        return callback(err);
      }

      if (!req.app.get('requireGivenName') && !account.givenName) {
        account.givenName = 'Anonymous';
      }

      if (!req.app.get('requireSurname') && !account.surname) {
        account.surname = 'Anonymous';
      }

      callback(null, account);
    });
  };
}

/**
 * Assert that all required fields in the registration form have been specified
 * by the user submitting the form.  If a required field is missing, a response
 * will be rendered to the user.
 *
 * @method
 * @private
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {Object} form - The http form.
 *
 * @return {Function} Return a function which accepts a callback.
 */
function assertRequired(req, res, form) {
  var view = req.app.get('stormpathRegistrationView');

  return function(callback) {
    async.each(Object.keys(FIELDS), function(key, next) {
      if (req.app.get('stormpathRequire' + helpers.title(key)) && !form.data[key]) {
        helpers.render(view, res, { error: FIELDS[key] + ' required.', form: form });
        req.app.get('stormpathLogger').info('User submitted a form with a missing key: ' + FIELDS[key] + '.');
        next(new Error(FIELDS[key] + ' required.'));
      } else {
        next();
      }
    }, function(err) {
      callback(err);
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
  var postRegistrationHandler = req.app.get('stormpathPostRegistrationHandler');
  var authenticator = new stormpath.OAuthPasswordGrantRequestAuthenticator(application);

  if (req.method === 'POST' && accepts === 'json') {
    application.createAccount(req.body, function(err, account) {
      if (err) {
        return res.status(400).json({ error: err.userMessage || err.message });
      }else{
        res.json(account);
      }
    });
  } else if (accepts === 'html') {
    forms.registrationForm.handle(req, {
      // If we get here, it means the user is submitting a registration request, so
      // we should attempt to validate the user's data and create their account.
      success: function(form) {
        async.waterfall([
          assertRequired(req, res, form),
          buildAccount(req, form),
          createAccount(req, res, form),
        ], function(err,account) {
          if (err) {
            logger.info(err);
            helpers.render(view, res, { error: err.userMessage, form: form });
          }
          else if(account.status==='UNVERIFIED'){
            // account is unverified, show a message on the login page
            res.redirect(302,config.web.login.uri+'?status=unverified');
          }
          else if(config.web.register.autoAuthorize){
            authenticator.authenticate({
              username: req.body.email || uuid(),
              password: req.body.password || uuid()
            }, function(err, passwordGrantAuthenticationResult) {
              if (err) {
                return res.status(400).json({ error: err.userMessage || err.message });
              } else {
                helpers.createSession(passwordGrantAuthenticationResult,account,req,res);
                if (postRegistrationHandler) {
                  postRegistrationHandler(req.user, req, res, function() {
                    res.redirect(302, req.query.next || next);
                  });
                } else {
                  res.redirect(302, req.query.next || next);
                }
              }
            });

          }else{
            res.redirect(302,config.web.login.uri+'?status=created');
          }

        });
      },

      // If we get here, it means the user didn't supply required form fields.
      error: function(form) {
        var formErrors = helpers.collectFormErrors(form);
        helpers.render(view, res, { form: form, formErrors: formErrors });
      },

      // If we get here, it means the user is doing a simple GET request, so we
      // should just render the registration template.
      empty: function(form) {
        helpers.render(view, res, { form: form });
      }
    });
  } else {
    res.status(415).end();
  }
}

module.exports = register;