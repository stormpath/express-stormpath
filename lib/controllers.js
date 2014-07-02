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


module.exports.logout = function(req, res) {
  if (req.session) {
    req.session.reset();
  }

  res.redirect('/');
};
