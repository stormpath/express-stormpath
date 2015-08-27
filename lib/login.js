var forms = require('./forms');
var helpers = require('./helpers');
var stormpath = require('stormpath');
var uuid = require('uuid');
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
  var authenticator = stormpath.OAuthPasswordGrantRequestAuthenticator(application);
  var logger = req.app.get('stormpathLogger');

  res.locals.status = req.query.status;

  if (req.method === 'POST' && accepts === 'json') {
    authenticator.authenticate({
      username: req.body.username || uuid(),
      password: req.body.password || uuid()
    }, function(err, passwordGrantAuthenticationResult) {
      if (err) {
        return res.status(400).json({ error: err.userMessage || err.message });
      } else {
        passwordGrantAuthenticationResult.getAccount(function(err, account) {
          if (err) {
            req.app.get('stormpathLogger').info('After successfully authenticating user ' + account.email + ', we were unable to retrieve the account details from Stormpath.');
            return res.status(400).json({ error: err.userMessage || err.message });
          } else {
            helpers.loginResponder(passwordGrantAuthenticationResult,account,req,res);
          }
        });
      }
    });
  } else if (accepts === 'html') {
    if(config.web.spaRoot){
      res.sendFile(config.web.spaRoot);
    }else{
      forms.loginForm.handle(req, {
        // If we get here, it means the user is submitting a login request, so we
        // should attempt to log the user into their account.
        success: function(form) {
          authenticator.authenticate({
            username: form.data.login,
            password: form.data.password
          }, function(err, passwordGrantAuthenticationResult) {
            if (err) {
              helpers.render(req,res, view, { error: err.userMessage, form: form });
              logger.info('User attempted to authenticated via the login page, but supplied invalid credentials.');
            } else {
              passwordGrantAuthenticationResult.getAccount(function(err, account) {
                if (err) {
                  helpers.render(req,res, view, { error: err.userMessage, form: form });
                  logger.info('After successfully authenticating user ' + account.email + ', we were unable to retrieve the account details from Stormpath.');
                } else {
                  helpers.loginResponder(passwordGrantAuthenticationResult,account,req,res);
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
            helpers.render(req,res, view, { form: form , formActionUri: formActionUri });
          } else {
            var formErrors = helpers.collectFormErrors(form);
            helpers.render(req,res, view, { form: form, formErrors: formErrors, formActionUri: formActionUri });
          }
        },

        // If we get here, it means the user is doing a simple GET request, so we
        // should just render the login template.
        empty: function(form) {
          helpers.render(req,res, view, { form: form, formActionUri: formActionUri });
        }
      });
    }
  }
};