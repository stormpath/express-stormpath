var forms = require('./forms');


module.exports.register = function(req, res) {
  req.app.set('views', __dirname + '/views');
  req.app.set('view engine', 'jade');
  res.locals.app = req.app;
  res.locals.csrfToken = req.csrfToken();

  forms.registrationForm.handle(req, {
    // If we get here, it means the user is submitting a registration request, so
    // we should attempt to validate the user's data and create their account.
    success: function(form) {

      // Validate required fields.
      if (req.app.get('stormpathRequireEmail') && !form.data.email) {
        res.render('register', { error: 'Email required.', form: form });
      }
      if (req.app.get('stormpathRequirePassword') && !form.data.password) {
        res.render('register', { error: 'Password required.', form: form });
      }
      if (req.app.get('stormpathRequireUsername') && !form.data.username) {
        res.render('register', { error: 'Username required.', form: form });
      }
      if (req.app.get('stormpathRequireGivenName') && !form.data.givenName) {
        res.render('register', { error: 'First Name required.', form: form });
      }
      if (req.app.get('stormpathRequireMiddleName') && !form.data.middleName) {
        res.render('register', { error: 'Middle Name required.', form: form });
      }
      if (req.app.get('stormpathRequireSurname') && !form.data.surname) {
        res.render('register', { error: 'Last Name required.', form: form });
      }

      // Build account object from enabled fields.
      var acc = {};
      if (req.app.get('stormpathEnableUsername') && form.data.username) {
        acc.username = form.data.username;
      }
      if (req.app.get('stormpathEnableEmail') && form.data.email) {
        acc.email = form.data.email;
      }
      if (req.app.get('stormpathEnablePassword') && form.data.password) {
        acc.password = form.data.password;
      }
      if (req.app.get('stormpathEnableGivenName') && form.data.givenName) {
        acc.givenName = form.data.givenName;
      }
      if (req.app.get('stormpathEnableMiddleName') && form.data.middleName) {
        acc.middleName = form.data.middleName;
      }
      if (req.app.get('stormpathEnableSurname') && form.data.surname) {
        acc.surname = form.data.surname;
      }

      // Create account with Stormpath.
      req.app.get('stormpathApplication').createAccount(acc, function(err, account) {
        if (err) {
          res.render('register', { error: err.userMessage, form: form });
        } else {
          req.session.user = account;
          res.locals.user = account;

          var url = req.query.next || req.app.get('stormpathRedirectUrl');
          res.redirect(302, url);
        }
      });
    },

    // If we get here, it means the user didn't supply required form fields.
    error: function(form) {
      res.render('register', { form: form });
    },

    // If we get here, it means the user is doing a simple GET request, so we
    // should just render the registration template.
    empty: function(form) {
      res.render('register', { form: form });
    }
  });
};


module.exports.login = function(req, res) {
  req.app.set('views', __dirname + '/views');
  req.app.set('view engine', 'jade');
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
          res.render('login', { error: err.userMessage, form: form });
        } else {
          result.getAccount(function(err, account) {
            if (err) {
              res.render('login', { error: err.userMessage, form: form });
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
      res.render('login', { form: form });
    },

    // If we get here, it means the user is doing a simple GET request, so we
    // should just render the login template.
    empty: function(form) {
      res.render('login', { form: form });
    }
  });
};


module.exports.logout = function(req, res) {
  if (req.session) {
    req.session.reset();
  }

  res.redirect('/');
};
