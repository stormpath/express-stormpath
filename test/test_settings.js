'use strict';

var assert = require('assert');

var express = require('express');

var settings = require('../lib/settings');

describe('init', function() {
  var opts = [
    'apiKeyId',
    'apiKeySecret',
    'apiKeyFile',
    'application',
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

describe('validate', function() {
});
