var forms = require('./forms');


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
              res.redirect(302, req.app.get('stormpathRedirectUrl'));
            }
          });
        }
      });
    },

    // If we get here, it means the user didn't supply required form fields.
    error: function(form) {
      res.render('login', { error: 'Required fields missing.', form: form });
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
