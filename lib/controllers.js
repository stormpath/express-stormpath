'use strict';


var async = require('async');

var forms = require('./forms');
var helpers = require('./helpers');


var FIELDS = {
  'username': 'Username',
  'givenName': 'First Name',
  'middleName': 'Middle Name',
  'surname': 'Last Name',
  'email': 'Email',
  'password': 'Password',
};


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
        next(new Error(FIELDS[key] + ' required.'));
      } else {
        next();
      }
    }, function(err) {
      callback(err);
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
      if (req.app.get('stormpathEnable' + helpers.title(key)) && form.data[key]) {
        account[key] = form.data[key];
        next();
      } else {
        next();
      }
    }, function(err) {
      callback(err, account);
    });
  };
}


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
function createAccount(req, res, form) {
  var view = req.app.get('stormpathRegistrationView');

  return function(account, callback) {
    req.app.get('stormpathApplication').createAccount(account, function(err, account) {
      if (err) {
        helpers.render(view, res, { error: err.userMessage, form: form });
        callback(err);
      } else {
        req.session.user = account;
        res.locals.user = account;
        callback();
      }
    });
  };
}


/**
 * This controller registers a new user account.  If there are any errors, an
 * error page is rendered.  If the process succeeds, the user will be logged in
 * and redirected.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.register = function(req, res) {
  var view = req.app.get('stormpathRegistrationView');

  res.locals.app = req.app;
  res.locals.csrfToken = req.csrfToken();

  forms.registrationForm.handle(req, {
    // If we get here, it means the user is submitting a registration request, so
    // we should attempt to validate the user's data and create their account.
    success: function(form) {
      async.waterfall([
        assertRequired(req, res, form),
        buildAccount(req, form),
        createAccount(req, res, form),
      ], function(err) {
        // If we get here, it means the account was successfully created.
        if (!err) {
          var url = req.query.next || req.app.get('stormpathRedirectUrl');
          res.redirect(302, url);
        }
      });
    },

    // If we get here, it means the user didn't supply required form fields.
    error: function(form) {
      helpers.render(view, res, { form: form });
    },

    // If we get here, it means the user is doing a simple GET request, so we
    // should just render the registration template.
    empty: function(form) {
      helpers.render(view, res, { form: form });
    }
  });
};


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
module.exports.login = function(req, res) {
  var view = req.app.get('stormpathLoginView');

  res.locals.app = req.app;
  res.locals.csrfToken = req.csrfToken();

  forms.loginForm.handle(req, {
    // If we get here, it means the user is submitting a login request, so we
    // should attempt to log the user into their account.
    success: function(form) {
      req.app.get('stormpathApplication').authenticateAccount({
        username: form.data.login,
        password: form.data.password
      }, function(err, result) {
        if (err) {
          helpers.render(view, res, { error: err.userMessage, form: form });
        } else {
          result.getAccount(function(err, account) {
            if (err) {
              helpers.render(view, res, { error: err.userMessage, form: form });
            } else {
              req.session.user = account;
              res.locals.user = account;

              var url = req.query.next || req.app.get('stormpathRedirectUrl');
              res.redirect(302, url);
            }
          });
        }
      });
    },

    // If we get here, it means the user didn't supply required form fields.
    error: function(form) {
      helpers.render(view, res, { form: form });
    },

    // If we get here, it means the user is doing a simple GET request, so we
    // should just render the login template.
    empty: function(form) {
      helpers.render(view, res, { form: form });
    }
  });
};


/**
 * This controller logs out an existing user, then redirects them to the
 * homepage.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.logout = function(req, res) {
  if (req.session) {
    req.session.reset();
  }

  res.redirect('/');
};


/**
 * This controller initializes the 'password reset' workflow for a user who has
 * forgotten his password.
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
 */
module.exports.forgot = function(req, res) {
  var view = req.app.get('stormpathForgotPasswordView');

  res.locals.app = req.app;
  res.locals.csrfToken = req.csrfToken();

  forms.forgotPasswordForm.handle(req, {
    // If we get here, it means the user is submitting a password reset
    // request, so we should attempt to send the user a password reset email.
    success: function(form) {
      req.app.get('stormpathApplication').sendPasswordResetEmail(form.data.email, function(err, token) {
        if (err) {
          helpers.render(view, res, { error: 'Invalid email address.', form: form });
        } else {
          helpers.render(req.app.get('stormpathForgotPasswordEmailSentView'), res, { email: form.data.email });
        }
      });
    },

    // If we get here, it means the user didn't supply required form fields.
    error: function(form) {
      helpers.render(view, res, { form: form });
    },

    // If we get here, it means the user is doing a simple GET request, so we
    // should just render the forgot password template.
    empty: function(form) {
      helpers.render(view, res, { form: form });
    }
  });
};
