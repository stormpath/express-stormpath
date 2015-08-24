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

module.exports.login = require('./login');

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
  if(req.cookies && req.cookies.idSiteSession){
    module.exports.idSiteRedirect({logout:true})(req,res);
  }else{
    authentication.deleteCookies(req,res);
    res.redirect(req.app.get('stormpathConfig').web.logout.nextUri);
  }

};

module.exports.verifyEmail = require('./verify-email');


module.exports.forgotPassword = require('./forgot-password');

module.exports.changePassword = require('./change-password');


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
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var loginHandler = req.app.get('stormpathPostLoginHandler');


  var registrationHandler = req.app.get('stormpathPostRegistrationHandler');

  if (!req.query.code) {
    res.status(400).json({message:'code parameter required'});
    logger.info('A user attempted to log in via Google OAuth without specifying an OAuth token.');
    return;
  }

  var userData = {
    providerData: {
      providerId: 'google',
      code: req.query.code,
    }
  };

  application.getAccount(userData, function(err, resp) {
    if (err) {
      res.status(err.status || 400).json(err);
      logger.info('During a Google OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
    } else {
      res.locals.user = resp.account;
      req.user = resp.account;

      var nextUrl = req.query.next || (resp.created ? config.web.register.nextUri : config.web.login.nextUri);

      if (resp.created && registrationHandler) {
        registrationHandler(req.user, req, res, function() {
          res.redirect(302, nextUrl);
        });
      } else if (loginHandler) {
        loginHandler(req.user, req, res, function() {
          res.redirect(302, nextUrl);
        });
      } else {
        res.redirect(302, nextUrl);
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
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  if (!req.query.access_token) {
    res.status(400).json({message:'access_token parameter required'});
    logger.info('A user attempted to log in via Facebook OAuth without specifying an OAuth token.');
    return;
  }


  var userData = {
    providerData: {
      providerId: 'facebook',
      accessToken: req.query.access_token,
    },
  };

  application.getAccount(userData, function(err, resp) {
    if (err) {
      logger.info('During a Facebook OAuth login attempt, we were unable to fetch the user\'s social account from Stormpath.');
      return helpers.render(req, res, req.app.get('stormpathFacebookLoginFailedView'));
    }

    res.locals.user = resp.account;
    req.user = resp.account;

    // Generate a new session -- this creates a session cookie.
    helpers.createIdSiteSession(req.user, req, res);

    var url = req.query.next || (resp.created ? config.web.register.nextUri : config.web.login.nextUri);
    res.redirect(302, url);
  });
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
module.exports.idSiteRedirect = function idSiteRedirectConstructor(options) {
  return function idSiteRedirectHandler(req, res){
    var application = req.app.get('stormpathApplication');
    var config = req.app.get('stormpathConfig');
    var cbUri = req.protocol + '://' + req.get('host') + config.web.idSite.uri;
    var url = application.createIdSiteUrl({
      callbackUri: cbUri,
      path: options.path,
      logout: options.logout
    });
    res.writeHead(302, {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Location': url,
    });
    res.end();
  };
};

// We should have the option to redict the user from ID site, back to the
// service provier, with a status=UNVERIFIED

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
  var config = req.app.get('stormpathConfig');
  var application = req.app.get('stormpathApplication');
  var logger = req.app.get('stormpathLogger');
  application.handleIdSiteCallback(req.originalUrl, function(err, result) {
    if (err) {
      res.status(500).end(err.toString());
      logger.info('While attempting to authenticate a user via ID site, the callback verification failed.');
    }
    else if(result.status==='LOGOUT'){
      authentication.deleteCookies(req,res);
      res.redirect(302,config.web.idSite.nextUri);
    }
    else if(result.status==='AUTHENTICATED'){
      helpers.createIdSiteSession(result.account,req,res);
      var url = req.query.next || config.web.idSite.nextUri;
      res.redirect(302, url);
    }else{
      res.status(500).end('Unknown ID site result status: '+result.status);
    }
  });
};
