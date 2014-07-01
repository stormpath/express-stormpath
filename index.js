var async = require('async');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var session = require('client-sessions');
var stormpath = require('stormpath');
var controllers = require('./controllers');

var authentication = require('./authentication');
var forms = require('./forms');
var helpers = require('./helpers');


function initClient(app) {
  return function(next) {
    if (app.get('stormpathApiKeyId') && app.get('stormpathApiKeySecret')) {
      module.exports.client = new stormpath.Client({
        apiKey: new stormpath.ApiKey(
          app.get('stormpathApiKeyId'),
          app.get('stormpathApiKeySecret')
        )
      });
      next();
    } else if (app.get('stormpathApiKeyFile')) {
      stormpath.loadApiKey(app.get('stormpathApiKeyFile'), function(err, apiKey) {
        module.exports.client = new stormpath.Client({apiKey: apiKey});
        next();
      });
    }
  };
}


function initApplication(app) {
  return function(next) {
    module.exports.client.getApplication(app.get('stormpathApplication'), function(err, application) {
      if (err) {
        throw new Error("ERROR: Couldn't find Stormpath application.");
      }

      module.exports.application = application;
      next();
    });
  };
}


function initMiddleware(app) {
  return function(next) {
    // Initialize session middleware.
    app.use(session({
      cookieName: 'stormpathSession',
      requestKey: 'session',
      secret: app.get('stormpathSecretKey'),
      duration: app.get('stormpathSessionDuration'),
      cookie: {
        httpOnly: true,
        secure: app.get('stormpathEnableHttps'),
      }
    }));

    // Parse the request body.
    app.use(bodyParser.urlencoded({
      extended: true,
    }));

    // Initialize CSRF middleware.
    app.use(csrf());

    next();
  };
}


module.exports.init = function(app, opts) {
  opts = opts || {};

  async.series([
    helpers.initSettings(app, opts),
    helpers.checkSettings(app),
    initClient(app),
    initApplication(app),
    initMiddleware(app),
  ]);

  return function(req, res, next) {
    async.series([
      function(callback) {
        helpers.getUser(req, res, callback);
      }
    ], function(err) {
      if (req.url === '/register' && req.app.get('stormpathEnableRegistration')) {
        controllers.register(req, res, next);
      } else if (req.url === '/login' && req.app.get('stormpathEnableLogin')) {
        controllers.login(req, res, next);
      } else if (req.url === '/logout' && req.app.get('stormpathEnableLogout')) {
        controllers.logout(req, res, next);
      } else {
        next();
      }
    });
  }
};


module.exports.loginRequired = authentication.loginRequired;
