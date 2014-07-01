var forms = require('./forms');
var stormpath = require('./index');


module.exports.login = function(req, res, next) {
  req.app.set('views', __dirname + '/views');
  req.app.set('view engine', 'jade');
  res.locals.csrfToken = req.csrfToken();

  forms.loginForm.handle(req, {
    // If we get here, it means the user is submitting a login request, so we
    // should attempt to log the user into their account.
    success: function(form) {
      stormpath.application.authenticateAccount({
        username: form.data.login,
        password: form.data.password
      }, function(err, result) {
        if (err) {
          res.render('login', { error: err.userMessage, form: form });
          next();
        } else {
          result.getAccount(function(err, account) {
            if (err) {
              res.render('login', { error: err.userMessage, form: form });
              next();
            } else {
              req.session.user = account;
              res.locals.user = account;
              res.redirect(302, req.app.get('stormpathRedirectUrl'));
              next();
            }
          });
        }
      });
    },

    // If we get here, it means the user didn't supply required form fields.
    error: function(form) {
      res.render('login', { error: 'Required fields missing.', form: form });
      next();
    },

    // If we get here, it means the user is doing a simple GET request, so we
    // should just render the login template.
    empty: function(form) {
      res.render('login', { form: form });
      next();
    }
  });
};


module.exports.logout = function(req, res, next) {
  if (req.session) {
    req.session.reset();
  }

  res.redirect('/');
  next();
};
