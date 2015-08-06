'use strict';

var forms = require('./forms');
var helpers = require('./helpers');
var authentication = require('./authentication');


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
module.exports.register = require('./register');

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
  authentication.deleteCookies(req,res);
  res.redirect(req.app.get('stormpathConfig').web.logout.nextUri);
};

module.exports.verifyEmail = require('./verify-email');


module.exports.forgotPassword = require('./forgot-password');

module.exports.resetPassword = require('./reset-password');


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
        req.app.get('stormpathLogger').info('An OAuth token exchange failed due to an improperly formed request.');
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
    req.app.get('stormpathLogger').info('A user attempted to log in via Google OAuth without specifying an OAuth token.');
    return;
  }

  var userData = {
    providerData: {
      providerId: 'google',
      code: req.query.code,
    },
  };

  req.app.get('stormpathApplication').getAccount(userData, function(err, resp) {
    if (err) {
      helpers.render(req.app.get('stormpathGoogleLoginFailedView'), res);
      req.app.get('stormpathLogger').info('During a Google OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
    } else {
      res.locals.user = resp.account;
      req.user = resp.account;

      if (resp.created && req.app.get('stormpathPostRegistrationHandler')) {
        req.app.get('stormpathPostRegistrationHandler')(req.user, req, res, function() {
          var url = req.query.next || req.app.get('stormpathRedirectUrl');
          res.redirect(302, url);
        });
      } else if (req.app.get('stormpathPostLoginHandler')) {
        req.app.get('stormpathPostLoginHandler')(req.user, req, res, function() {
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
    req.app.get('stormpathLogger').info('A user attempted to log in via Facebook OAuth without specifying an OAuth token.');
    return;
  }

  var userData = {
    providerData: {
      providerId: 'facebook',
      accessToken: req.query.access_token,
    },
  };

  req.app.get('stormpathApplication').getAccount(userData, function(err, resp) {
    if (err) {
      helpers.render(req.app.get('stormpathFacebookLoginFailedView'), res);
      req.app.get('stormpathLogger').info('During a Facebook OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
    } else {
      res.locals.user = resp.account;
      req.user = resp.account;

      if (resp.created && req.app.get('stormpathPostRegistrationHandler')) {
        req.app.get('stormpathPostRegistrationHandler')(req.user, req, res, function() {
          var url = req.query.next || req.app.get('stormpathRedirectUrl');
          res.redirect(302, url);
        });
      } else if (req.app.get('stormpathPostLoginHandler')) {
        req.app.get('stormpathPostLoginHandler')(req.user, req, res, function() {
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
    callbackUri: req.protocol + '://' + req.get('host') + req.app.get('stormpathIdSiteUrl'),
  });

  res.writeHead(302, {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Location': url,
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
    path: req.app.get('stormpathIdSiteRegistrationUrl'),
  });

  res.writeHead(302, {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Location': url,
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
      req.app.get('stormpathLogger').info('While attempting to authenticate a user via ID site, the callback verification failed.');
    } else {
      res.locals.user = result.account;
      req.user = result.account;

      var url = req.query.next || req.app.get('stormpathRedirectUrl');
      res.redirect(302, url);
    }
  });
};
