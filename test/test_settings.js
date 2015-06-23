'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var express = require('express');
var uuid = require('uuid');

var stormpathExpress = require('../');

describe('init', function() {

  it('should not require any options if you have them in your env', function() {
    var app = express();

    process.env.STORMPATH_CLIENT_APIKEY_ID = 'xxx';
    process.env.STORMPATH_CLIENT_APIKEY_SECRET = 'xxx';

    assert.doesNotThrow(
      function() {
        stormpathExpress.init(app);
      },
      TypeError
    );
    delete process.env.STORMPATH_CLIENT_APIKEY_ID;
    delete process.env.STORMPATH_CLIENT_APIKEY_SECRET;
  });

  it('should export options values on the app', function() {
    var app = express();
    var testConfig = {
      client:{
        apiKey:{
          id:'xx',
          secret: 'xx'
        }
      },
      application: {
        href: 'whatev'
      }
    };

    stormpathExpress.init(app, testConfig);

    assert.equal(app.get('stormpathConfig').application.href, testConfig.application.href);

  });

  it('should prefer explicitly provided values over environment variables', function() {
    var app = express();

    process.env.STORMPATH_CLIENT_APIKEY_ID = 'envKeyId';
    process.env.STORMPATH_CLIENT_APIKEY_SECRET = 'envKeySecret';

    stormpathExpress.init(app, {
      client: {
        apiKey:{
          id: 'configKeyId',
          secret: 'configKeySecret'
        }
      }
    });
    assert.equal(app.get('stormpathConfig').client.apiKey.id, 'configKeyId');
    assert.equal(app.get('stormpathConfig').client.apiKey.secret, 'configKeySecret');

    delete process.env.STORMPATH_CLIENT_APIKEY_ID;
    delete process.env.STORMPATH_CLIENT_APIKEY_SECRET;
  });

  it('should default only if no explicit or environment variables have been set', function() {
    var app = express();
    var config = {
      client:{
        apiKey:{
          id: 'xx',
          secret: 'xx'
        }
      }
    };
    stormpathExpress.init(app,config);
    assert.equal(app.get('stormpathConfig').client.cacheManager.defaultTtl, 300);

    process.env.STORMPATH_CLIENT_CACHEMANAGER_DEFAULTTTL = '10';

    stormpathExpress.init(app,config);
    assert.equal(app.get('stormpathConfig').client.cacheManager.defaultTtl, 10);

    delete process.env.STORMPATH_CLIENT_CACHEMANAGER_DEFAULTTTL;
  });
});

