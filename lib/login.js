var forms = require('./forms');
var helpers = require('./helpers');
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
module.exports = function login(req, res) {
  var nextUri = req.query.next;
  var config = req.app.get('stormpathConfig');
  var formActionUri = (config.web.login.uri + ( nextUri ? ('?next='+nextUri):'') );
  if (req.user && config.web.login.enabled) {
    var url = nextUri || config.web.login.nextUri;
    return res.redirect(302, url);
  }

  var view = req.app.get('stormpathConfig').web.login.view;
  var accepts = req.accepts(['html','json']);
  var application = req.app.get('stormpathApplication');
  var logger = req.app.get('stormpathLogger');

  res.locals.status = req.query.status;

  if (req.method === 'POST' && accepts === 'json') {
    req.app.get('stormpathApplication').authenticateAccount({
      username: req.body.login,
      password: req.body.password
    }, function(err, authenticationResult) {
      if (err) {
        return res.status(400).json({ error: err.userMessage || err.message });
      } else {
        authenticationResult.getAccount(function(err, account) {
          if (err) {
            req.app.get('stormpathLogger').info('After successfully authenticating user ' + account.email + ', we were unable to retrieve the account details from Stormpath.');
            return res.status(400).json({ error: err.userMessage || err.message });
          } else {
            helpers.loginResponder(authenticationResult,account,req,res);
          }
        });
      }
    });
  } else if (accepts === 'html') {
    forms.loginForm.handle(req, {
      // If we get here, it means the user is submitting a login request, so we
      // should attempt to log the user into their account.
      success: function(form) {
        application.authenticateAccount({
          username: form.data.login,
          password: form.data.password
        }, function(err, authenticationResult) {
          if (err) {
            helpers.render(view, res, { error: err.userMessage, form: form });
            logger.info('User attempted to authenticated via the login page, but supplied invalid credentials.');
          } else {
            authenticationResult.getAccount(function(err, account) {
              if (err) {
                helpers.render(view, res, { error: err.userMessage, form: form });
                logger.info('After successfully authenticating user ' + account.email + ', we were unable to retrieve the account details from Stormpath.');
              } else {
                helpers.loginResponder(authenticationResult,account,req,res);
              }
            });
          }
        });
      },

      // If we get here, it means the user didn't supply required form fields.
      error: function(form) {
        // Special case: if the user is being redirected to this page for the
        // first time, don't display any error.
        if (form.data && !form.data.login && !form.data.password) {
          helpers.render(view, res, { form: form , formActionUri: formActionUri });
        } else {
          var formErrors = helpers.collectFormErrors(form);
          helpers.render(view, res, { form: form, formErrors: formErrors, formActionUri: formActionUri });
        }
      },

      // If we get here, it means the user is doing a simple GET request, so we
      // should just render the login template.
      empty: function(form) {
        helpers.render(view, res, { form: form, formActionUri: formActionUri });
      }
    });
  }
};