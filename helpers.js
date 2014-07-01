var stormpath = require('stormpath');

var sp = require('./index');


module.exports.getUser = function(req, res, callback) {
  if (req.session && req.session.user) {
    sp.client.getAccount(req.session.user.href, { expand: 'customData' }, function(err, account) {
      if (err) {
        req.session.reset();
      } else {
        req.session.user = account;
        res.locals.user = account;
      }
      callback();
    });
  }
};


module.exports.initSettings = function(app, opts) {
  return function(next) {
    app.set('stormpathSecretKey', opts.secretKey || process.env.STORMPATH_SECRET_KEY);
    app.set('stormpathEnableHttps', opts.enableHttps || process.env.STORMPATH_ENABLE_HTTPS || false);
    app.set('stormpathSessionDuration', opts.sessionDuration || parseInt(process.env.STORMPATH_SESSION_DURATION) || 1000 * 60 * 60 * 24 * 30);
    app.set('stormpathApiKeyId', opts.apiKeyId || process.env.STORMPATH_API_KEY_ID);
    app.set('stormpathApiKeySecret', opts.apiKeySecret || process.env.STORMPATH_API_KEY_SECRET);
    app.set('stormpathApiKeyFile', opts.apiKeyFile || process.env.STORMPATH_API_KEY_FILE);
    app.set('stormpathApplication', opts.application || process.env.STORMPATH_APPLICATION);
    app.set('stormpathRedirectUrl', opts.redirectUrl || process.env.STORMPATH_REDIRECT_URL || '/');

    next();
  };
};


module.exports.checkSettings = function(app) {
  return function(next) {
    if (!app.get('stormpathSecretKey')) {
      throw new Error('ERROR: No Stormpath secretKey specified.');
    }

    if (!(
      (app.get('stormpathApiKeyID') && app.get('stormpathApiKeySecret')) ||
      app.get('stormpathApiKeyFile')
    )) {
      throw new Error('ERROR: No Stormpath credentials specified.');
    }

    if (!app.get('stormpathApplication')) {
      throw new Error('ERROR: No Stormpath application specified.');
    }

    next();
  };
};
