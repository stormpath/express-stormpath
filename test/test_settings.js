'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var express = require('express');

var settings = require('../lib/settings');

describe('init', function() {
  var opts = [
    'apiKeyId',
    'apiKeySecret',
    'apiKeyFile',
    'application',
    'debug',
    'secretKey',
    'enableHttps',
    'sessionDuration',
    'sessionDomain',
    'sessionMiddleware',
    'cache',
    'cacheHost',
    'cachePort',
    'cacheTTL',
    'cacheTTI',
    'cacheOptions',
    'oauthTTL',
    'social',
    'enableUsername',
    'enableGivenName',
    'enableMiddleName',
    'enableSurname',
    'enableEmail',
    'enablePassword',
    'requireUsername',
    'requireGivenName',
    'requireMiddleName',
    'requireSurname',
    'requireEmail',
    'requirePassword',
    'enableRegistration',
    'enableLogin',
    'enableLogout',
    'enableForgotPassword',
    'enableAccountVerification',
    'enableFacebook',
    'enableGoogle',
    'enableIdSite',
    'enableAutoLogin',
    'enableForgotPasswordChangeAutoLogin',
    'expandApiKeys',
    'expandCustomData',
    'expandDirectory',
    'expandGroups',
    'expandGroupMemberships',
    'expandProviderData',
    'expandTenant',
    'postRegistrationHandler',
    'templateContext',
    'registrationView',
    'loginView',
    'forgotPasswordView',
    'forgotPasswordEmailSentView',
    'forgotPasswordChangeView',
    'forgotPasswordChangeFailedView',
    'forgotPasswordCompleteView',
    'accountVerificationEmailSentView',
    'accountVerificationCompleteView',
    'accountVerificationFailedView',
    'idSiteVerificationFailedView',
    'googleLoginFailedView',
    'facebookLoginFailedView',
    'unauthorizedView',
    'registrationUrl',
    'loginUrl',
    'logoutUrl',
    'postLogoutRedirectUrl',
    'forgotPasswordUrl',
    'postForgotPasswordRedirectUrl',
    'forgotPasswordChangeUrl',
    'postForgotPasswordChangeRedirectUrl',
    'accountVerificationCompleteUrl',
    'getOauthTokenUrl',
    'redirectUrl',
    'facebookLoginUrl',
    'googleLoginUrl',
    'idSiteUrl',
    'idSiteRegistrationUrl',
  ];

  it('should not require any options', function() {
    var app = express();

    assert.doesNotThrow(
      function() {
        settings.init(app);
      },
      TypeError
    );
  });

  it('should export options values on the app', function() {
    var app = express();
    var testOpts = {};

    for (var i = 0; i < opts.length; i++) {
      testOpts[opts[i]] = 'xxx';
    }

    settings.init(app, testOpts);

    for (var key in testOpts) {
      var exportedName = 'stormpath' + key.charAt(0).toUpperCase() + key.slice(1);
      assert.equal(app.get(exportedName), 'xxx');
    }
  });

  it('should prefer explicitly provided values over environment variables', function() {
    var app = express();

    process.env.STORMPATH_API_KEY_ID = 'xxx';

    settings.init(app, { apiKeyId: 'yyy' });
    assert.equal(app.get('stormpathApiKeyId'), 'yyy');

    delete process.env.STORMPATH_API_KEY_ID;
  });

  it('should default only if no explicit or environment variables have been set', function() {
    var app = express();

    settings.init(app);
    assert.equal(app.get('stormpathCache'), 'memory');

    process.env.STORMPATH_CACHE = 'redis';

    settings.init(app);
    assert.equal(app.get('stormpathCache'), 'redis');

    settings.init(app, { cache: 'blah' });
    assert.equal(app.get('stormpathCache'), 'blah');

    delete process.env.STORMPATH_CACHE;
  });
});

describe('prep', function() {
  it('should generate a secret key if one isn\'t supplied', function() {
    var app = express();

    settings.init(app);
    settings.prep(app);

    assert(app.get('stormpathSecretKey'));
  });

  it('should not do anything if api keys are present', function() {
    var app = express();

    settings.init(app, { apiKeyId: 'xxx', apiKeySecret: 'xxx' });
    settings.prep(app);

    assert.equal(app.get('stormpathApiKeyId'), 'xxx');
    assert.equal(app.get('stormpathApiKeySecret'), 'xxx');
    assert.equal(app.get('stormpathApiKeyFile'), undefined);
  });

  it('should not do anything if an api key file is specified', function() {
    var app = express();

    settings.init(app, { apiKeyFile: 'blah.properties' });
    settings.prep(app);

    assert.equal(app.get('stormpathApiKeyId'), undefined);
    assert.equal(app.get('stormpathApiKeySecret'), undefined);
    assert.equal(app.get('stormpathApiKeyFile'), 'blah.properties');
  });

  it('should try to use the local apiKey.properties file if no settings are specified', function() {
    var fd = fs.openSync('apiKey.properties', 'w');
    fs.writeSync(fd, new Buffer('hi there'));
    fs.closeSync(fd);

    var app = express();

    settings.init(app);
    settings.prep(app);

    fs.unlinkSync('apiKey.properties');

    assert.equal(app.get('stormpathApiKeyFile'), 'apiKey.properties');
  });

  it('should try to use ~/.stormpath/apiKey.properties file if no settings are specified and apiKey.properties doesn\'t exist', function() {
    var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var apiKeyFile = path.join(homeDir, '.stormpath', 'apiKey.properties');
    var apiKeyFileBackup = apiKeyFile + '.backup';

    if (fs.existsSync(apiKeyFile)) {
      fs.renameSync(apiKeyFile, apiKeyFileBackup);
    }

    if (!fs.existsSync(path.join(homeDir, '.stormpath'))) {
      fs.mkdirSync(path.join(homeDir, '.stormpath'));
    }

    var fd = fs.openSync(apiKeyFile, 'w');
    fs.writeSync(fd, new Buffer('hi there'));
    fs.closeSync(fd);

    var app = express();

    settings.init(app);
    settings.prep(app);

    fs.unlinkSync(apiKeyFile);

    if (fs.existsSync(apiKeyFileBackup)) {
      fs.renameSync(apiKeyFileBackup, apiKeyFile);
    }

    assert.equal(app.get('stormpathApiKeyFile'), apiKeyFile);
  });
});

describe('validate', function() {
  it('should throw an error if no api key is specified', function() {
    var app = express();

    settings.init(app, { apiKeyId: 'xxx' });

    assert.throws(
      function() {
        settings.validate(app);
      },
      Error
    );
  });

  it('should throw an error if no api key file is specified', function() {
    var app = express();

    settings.init(app, { apiKeySecret: 'xxx' });

    assert.throws(
      function() {
        settings.validate(app);
      },
      Error
    );
  });

  it('should throw an error if an invalid api key file is specified', function() {
    var app = express();

    settings.init(app, { apiKeyFile: 'woooo' });

    assert.throws(
      function() {
        settings.validate(app);
      },
      Error
    );
  });
});
