'use strict';

var assert = require('assert');

var express = require('express');

var settings = require('../lib/settings');

describe('init', function() {
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
    var opts = {
      apiKeyId:                             'xxx',
      apiKeySecret:                         'xxx',
      apiKeyFile:                           'xxx',
      application:                          'xxx',
      secretKey:                            'xxx',
      enableHttps:                          'xxx',
      sessionDuration:                      'xxx',
      sessionDomain:                        'xxx',
      sessionMiddleware:                    'xxx',
      cache:                                'xxx',
      cacheHost:                            'xxx',
      cachePort:                            'xxx',
      cacheTTL:                             'xxx',
      cacheTTI:                             'xxx',
      cacheOptions:                         'xxx',
      oauthTTL:                             'xxx',
      social:                               'xxx',
      enableUsername:                       'xxx',
      enableGivenName:                      'xxx',
      enableMiddleName:                     'xxx',
      enableSurname:                        'xxx',
      enableEmail:                          'xxx',
      enablePassword:                       'xxx',
      requireUsername:                      'xxx',
      requireGivenName:                     'xxx',
      requireMiddleName:                    'xxx',
      requireSurname:                       'xxx',
      requireEmail:                         'xxx',
      requirePassword:                      'xxx',
      enableRegistration:                   'xxx',
      enableLogin:                          'xxx',
      enableLogout:                         'xxx',
      enableForgotPassword:                 'xxx',
      enableAccountVerification:            'xxx',
      enableFacebook:                       'xxx',
      enableGoogle:                         'xxx',
      enableIdSite:                         'xxx',
      enableAutoLogin:                      'xxx',
      enableForgotPasswordChangeAutoLogin:  'xxx',
      expandApiKeys:                        'xxx',
      expandCustomData:                     'xxx',
      expandDirectory:                      'xxx',
      expandGroups:                         'xxx',
      expandGroupMemberships:               'xxx',
      expandProviderData:                   'xxx',
      expandTenant:                         'xxx',
      postRegistrationHandler:              'xxx',
      templateContext:                      'xxx',
      registrationView:                     'xxx',
      loginView:                            'xxx',
      forgotPasswordView:                   'xxx',
      forgotPasswordEmailSentView:          'xxx',
      forgotPasswordChangeView:             'xxx',
      forgotPasswordChangeFailedView:       'xxx',
      forgotPasswordCompleteView:           'xxx',
      accountVerificationEmailSentView:     'xxx',
      accountVerificationCompleteView:      'xxx',
      accountVerificationFailedView:        'xxx',
      idSiteVerificationFailedView:         'xxx',
      googleLoginFailedView:                'xxx',
      facebookLoginFailedView:              'xxx',
      unauthorizedView:                     'xxx',
      registrationUrl:                      'xxx',
      loginUrl:                             'xxx',
      logoutUrl:                            'xxx',
      postLogoutRedirectUrl:                'xxx',
      forgotPasswordUrl:                    'xxx',
      postForgotPasswordRedirectUrl:        'xxx',
      forgotPasswordChangeUrl:              'xxx',
      postForgotPasswordChangeRedirectUrl:  'xxx',
      accountVerificationCompleteUrl:       'xxx',
      getOauthTokenUrl:                     'xxx',
      redirectUrl:                          'xxx',
      facebookLoginUrl:                     'xxx',
      googleLoginUrl:                       'xxx',
      idSiteUrl:                            'xxx',
      idSiteRegistrationUrl:                'xxx',
    };

    settings.init(app, opts);

    for (var key in opts) {
      var exportedName = 'stormpath' + key.charAt(0).toUpperCase() + key.slice(1);
      assert.equal(app.get(exportedName), 'xxx');
    }
  });

  it('should export options values on the app', function() {
  });
});

describe('validate', function() {
});
