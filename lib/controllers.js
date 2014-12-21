'use strict';


var async = require('async');
var Client = require('node-rest-client').Client;

var forms = require('./forms');
var helpers = require('./helpers');


var FIELDS = {
  'username': 'Username',
  'givenName': 'First Name',
  'middleName': 'Middle Name',
  'surname': 'Last Name',
  'email': 'Email',
  'password': 'Password'
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
      } else if (req.app.get('stormpathEnableAccountVerification') && account.status === 'UNVERIFIED') {
        helpers.render(req.app.get('stormpathAccountVerificationEmailSentView'), res, { email: account.email });
        callback();
      } else {
        req.session.user = account.href;
        res.locals.user = account;
        req.user = account;
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
        if (!err && !req.app.get('stormpathEnableAccountVerification')) {
          if (req.app.get('stormpathPostRegistrationHandler')) {
            req.app.get('stormpathPostRegistrationHandler')(req.user, res, function() {
              var url = req.query.next || req.app.get('stormpathRedirectUrl');
              res.redirect(302, url);
            });
          } else {
            var url = req.query.next || req.app.get('stormpathRedirectUrl');
            res.redirect(302, url);
          }
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
  if (req.user && req.app.get('stormpathEnableAutoLogin')) {
    var url = req.query.next || req.app.get('stormpathRedirectUrl');
    return res.redirect(302, url);
  }

  var view = req.app.get('stormpathLoginView');

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
              req.session.user = account.href;
              res.locals.user = account;
              req.user = account;

              var url = req.query.next || req.app.get('stormpathRedirectUrl');
              res.redirect(302, url);
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
        helpers.render(view, res, { form: form });
      } else {
        var formErrors = helpers.collectFormErrors(form);
        helpers.render(view, res, { form: form, formErrors: formErrors });
      }
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
    req.session.destroy();
  }

  res.redirect(req.app.get('stormpathPostLogoutRedirectUrl'));
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

  res.locals.csrfToken = req.csrfToken();

  forms.forgotPasswordForm.handle(req, {
    // If we get here, it means the user is submitting a password reset
    // request, so we should attempt to send the user a password reset email.
    success: function(form) {
      req.app.get('stormpathApplication').sendPasswordResetEmail(form.data.email, function(err, token) {
        if (err) {
          helpers.render(view, res, { error: 'Invalid email address.', form: form });
        } else {
          res.redirect(req.app.get('stormpathPostForgotPasswordRedirectUrl'));
        }
      });
    },

    // If we get here, it means the user didn't supply required form fields.
    error: function(form) {
      var formErrors = helpers.collectFormErrors(form);
      helpers.render(view, res, { form: form, formErrors: formErrors });
    },

    // If we get here, it means the user is doing a simple GET request, so we
    // should just render the forgot password template.
    empty: function(form) {
      helpers.render(view, res, { form: form });
    }
  });
};

/**
 * This controller renders a page after forgot password to confirm that the
 * password reset email has been sent
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.forgotSent = function(req, res) {
  helpers.render(req.app.get('stormpathForgotPasswordEmailSentView'), res);
};

/**
 * Allow a user to change his password.
 *
 * This can only happen if a user has reset their password, received the
 * password reset email, then clicked the link in the email which redirects them
 * to this controller.
 *
 * The URL this controller is bound to, and the view used to render this page
 * can all be controlled via express-stormpath settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.forgotChange = function(req, res) {
  var view = req.app.get('stormpathForgotPasswordChangeView');

  res.locals.csrfToken = req.csrfToken();

  req.app.get('stormpathApplication').verifyPasswordResetToken(req.query.sptoken, function(err, result) {
    if (err) {
      helpers.render(req.app.get('stormpathForgotPasswordChangeFailedView'), res);
    } else {
      forms.changePasswordForm.handle(req, {
        // If we get here, it means the user is submitting a password change
        // request, so we should attempt to change the user's password.
        success: function(form) {
          if (form.data.password !== form.data.passwordAgain) {
            helpers.render(view, res, { error: 'Passwords do not match.', form: form });
          } else {
            result.password = form.data.password;
            result.save(function(err, done) {
              if (err) {
                helpers.render(view, res, { error: err.userMessage, form: form });
              } else {
                if(req.app.get('stormpathEnableForgotPasswordChangeAutoLogin')){
                  req.session.user = result.account.href;
                  res.locals.user = result.account;
                  req.user = result.account;
                }

                res.redirect(req.app.get('stormpathPostForgotPasswordChangeRedirectUrl'));
              }
            });
          }
        },

        // If we get here, it means the user didn't supply required form fields.
        error: function(form) {
          // Special case: if the user is being redirected to this page for the
          // first time, don't display any error.
          if (form.data && !form.data.password && !form.data.passwordAgain) {
            helpers.render(view, res, { form: form });
          } else {
            var formErrors = helpers.collectFormErrors(form);
            helpers.render(view, res, { form: form, formErrors: formErrors });
          }
        },

        // If we get here, it means the user is doing a simple GET request, so we
        // should just render the forgot password template.
        empty: function(form) {
          helpers.render(view, res, { form: form });
        }
      });
    }
  });
};

/**
 * This controller renders a page to confirm that password reset is completed
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.forgotChangeDone = function(req, res) {
  helpers.render(req.app.get('stormpathForgotPasswordCompleteView'), res);
};


/**
 * Complete a user's account verification.
 *
 * This can only happen if a user has registered with the account verification
 * workflow enabled, and then clicked the link in their email which redirects
 * them to this controller.
 *
 * The URL this controller is bound to, and the view used to render this page
 * can all be controlled via express-stormpath settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.verificationComplete = function(req, res) {
  var view = req.app.get('stormpathAccountVerificationCompleteView');


  req.app.get('stormpathClient').getCurrentTenant(function(err, tenant) {
    if (err) {
      helpers.render(req.app.get('stormpathAccountVerificationFailedView'), res);
    } else {
      tenant.verifyAccountEmail(req.query.sptoken, function(err, account) {
        if (err) {
          helpers.render(req.app.get('stormpathAccountVerificationFailedView'), res);
        } else {
          req.app.get('stormpathClient').getAccount(account.href, function(err, acc) {
            if (err) {
              helpers.render(req.app.get('stormpathAccountVerificationFailedView'), res);
            } else {
              req.session.user = acc.href;
              res.locals.user = acc;
              req.user = acc;

              if (req.app.get('stormpathPostRegistrationHandler')) {
                req.app.get('stormpathPostRegistrationHandler')(req.user, res, function() {
                  helpers.render(req.app.get('stormpathAccountVerificationCompleteView'), res);
                });
              } else {
                helpers.render(req.app.get('stormpathAccountVerificationCompleteView'), res);
              }
            }
          });
        }
      });
    }
  });
};



/**
 * Allow a developer to exchange their API keys for an OAuth token.
 *
 * The URL this controller is bound to can be controlled via express-stormpath
 * settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.getToken = function(req, res) {
  if (!req.user) {
    res.status(401).json({ error: 'Invalid API credentials.' });
  } else {
    req.app.get('stormpathApplication').authenticateApiRequest({
      request: req,
      ttl: req.app.get('stormpathOauthTTL'),
      scopeFactory: function(account, requestedScopes) {
        return requestedScopes;
      }
    }, function(err, authResult) {
      if (err) {
        res.json(503, { error: 'Something went wrong. Please try again.' });
      } else {
        res.json(authResult.tokenResponse);
      }
    });
  }
};


/**
 * This controller logs in an existing user with Google OAuth.
 *
 * When a user logs in with Google (using Javascript), Google will redirect the
 * user to this view, along with an access code for the user.
 *
 * What we do here is grab this access code and send it to Stormpath to handle
 * the OAuth negotiation.  Once this is done, we log this user in using normal
 * sessions, and from this point on -- this user is treated like a normal system
 * user!
 *
 * The URL this controller is bound to, and the view used to render this page
 * can all be controlled via express-stormpath settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.googleLogin = function(req, res) {
  if (!req.query.code) {
    helpers.render(req.app.get('stormpathGoogleLoginFailedView'), res);
    return;
  }

  var code = req.query.code;
  var client = new Client();
  var args = {
    parameters: {
      grant_type: "authorization_code",
      code: req.query.code,
      client_id: req.app.get("stormpathSocial").google.clientId,
      client_secret: req.app.get("stormpathSocial").google.clientSecret,
      redirect_uri: req.protocol + "://" + req.get('host') + req.app.get('stormpathGoogleLoginUrl')
    },
    headers:{"Content-Type": "application/x-www-form-urlencoded"}
  };

  client.post("https://www.googleapis.com/oauth2/v3/token", args, function(data,response) {
    var data = JSON.parse(data);
    if (data.access_token) {
      var userData = {
        providerData: {
          providerId: 'google',
          accessToken: data.access_token
        }
      };

      req.app.get('stormpathApplication').getAccount(userData, function(err, resp) {
        if (err) {
          helpers.render(req.app.get('stormpathGoogleLoginFailedView'), res);
        } else {
          req.session.user = resp.account.href;
          res.locals.user = resp.account;
          req.user = resp.account;

          if (resp.created && req.app.get('stormpathPostRegistrationHandler')) {
            req.app.get('stormpathPostRegistrationHandler')(req.user, res, function() {
              var url = req.query.next || req.app.get('stormpathRedirectUrl');
              res.redirect(302, url);
            });
          } else {
            var url = req.query.next || req.app.get('stormpathRedirectUrl');
            res.redirect(302, url);
          }
        }
      });
    } else {
      helpers.render(req.app.get('stormpathGoogleLoginFailedView'), res);
    }
  });



};


/**
 * This controller logs in an existing user with Facebook OAuth.
 *
 * When a user logs in with Facebook, all of the authentication happens on the
 * client side with Javascript.  Since all authentication happens with
 * Javascript, we *need* to force a newly created and / or logged in Facebook
 * user to redirect to this controller.
 *
 * What this controller does is:
 *
 *  - Read the user's session using the Facebook SDK, extracting the user's
 *    Facebook access token.
 *  - Once we have the user's access token, we send it to Stormpath, so that
 *    we can either create (or update) the user on Stormpath's side.
 *  - Then we retrieve the Stormpath account object for the user, and log
 *    them in using our normal session support.
 *
 * The URL this controller is bound to, and the view used to render this page
 * can all be controlled via express-stormpath settings.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.facebookLogin = function(req, res) {
  if (!req.query.access_token) {
    helpers.render(req.app.get('stormpathFacebookLoginFailedView'), res);
    return;
  }

  var userData = {
    providerData: {
      providerId: 'facebook',
      accessToken: req.query.access_token
    }
  };

  req.app.get('stormpathApplication').getAccount(userData, function(err, resp) {
    if (err) {
      helpers.render(req.app.get('stormpathFacebookLoginFailedView'), res);
    } else {
      req.session.user = resp.account.href;
      res.locals.user = resp.account;
      req.user = resp.account;

      if (resp.created && req.app.get('stormpathPostRegistrationHandler')) {
        req.app.get('stormpathPostRegistrationHandler')(req.user, res, function() {
          var url = req.query.next || req.app.get('stormpathRedirectUrl');
          res.redirect(302, url);
        });
      } else {
        var url = req.query.next || req.app.get('stormpathRedirectUrl');
        res.redirect(302, url);
      }
    }
  });
};


/**
 * This controller logs in an existing user using Stormpath's hosted ID Site
 * service.  This will redirect the user to the ID site which allows a user to
 * log in.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.idSiteLogin = function(req, res) {
  var url = req.app.get('stormpathApplication').createIdSiteUrl({
    callbackUri: req.protocol + '://' + req.get('host') + req.app.get('stormpathIdSiteUrl')
  });

  res.writeHead(302, {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Location': url
  });
  res.end();
};


/**
 * This controller registers a new user using Stormpath's hosted ID Site
 * service.  This will redirect the user to the ID site which allows a user to
 * register.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.idSiteRegister = function(req, res) {
  var url = req.app.get('stormpathApplication').createIdSiteUrl({
    callbackUri: req.protocol + '://' + req.get('host') + req.app.get('stormpathIdSiteUrl'),
    path: req.app.get('stormpathIdSiteRegistrationUrl')
  });

  res.writeHead(302, {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Location': url
  });
  res.end();
};


/**
 * This controller handles a Stormpath ID Site authentication.  Once a user is
 * authenticated, they'll be returned to the site.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports.idSiteVerify = function(req, res) {
  req.app.get('stormpathApplication').handleIdSiteCallback(req.originalUrl, function(err, result) {
    if (err) {
      helpers.render(req.app.get('stormpathIDSiteVerificationFailedView'), res);
    } else {
      req.session.user = result.account.href;
      res.locals.user = result.account;
      req.user = result.account;

      var url = req.query.next || req.app.get('stormpathRedirectUrl');
      res.redirect(302, url);
    }
  });
};
