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

    stormpathExpress.init(app);
    assert.equal(app.get('stormpathCache'), 'memory');

    process.env.STORMPATH_CACHE = 'redis';

    stormpathExpress.init(app);
    assert.equal(app.get('stormpathCache'), 'redis');

    stormpathExpress.init(app, { cache: 'blah' });
    assert.equal(app.get('stormpathCache'), 'blah');

    delete process.env.STORMPATH_CACHE;
  });
});

describe('prep', function() {
  it('should generate a secret key if one isn\'t supplied', function() {
    var app = express();

    stormpathExpress.init(app);
    stormpathExpress.prep(app);

    assert(app.get('stormpathSecretKey'));
  });

  it('should not do anything if api keys are present', function() {
    var app = express();

    stormpathExpress.init(app, { apiKeyId: 'xxx', apiKeySecret: 'xxx' });
    stormpathExpress.prep(app);

    assert.equal(app.get('stormpathApiKeyId'), 'xxx');
    assert.equal(app.get('stormpathApiKeySecret'), 'xxx');
    assert.equal(app.get('stormpathApiKeyFile'), undefined);
  });

  it('should not do anything if an api key file is specified', function() {
    var app = express();

    stormpathExpress.init(app, { apiKeyFile: 'blah.properties' });
    stormpathExpress.prep(app);

    assert.equal(app.get('stormpathApiKeyId'), process.env.STORMPATH_API_KEY_ID);
    assert.equal(app.get('stormpathApiKeySecret'), process.env.STORMPATH_API_KEY_SECRET);
    assert.equal(app.get('stormpathApiKeyFile'), 'blah.properties');
  });

  it('should try to use the local apiKey.properties file if no settings are specified', function() {
    var fd = fs.openSync('apiKey.properties', 'w');
    fs.writeSync(fd, new Buffer('hi there'));
    fs.closeSync(fd);

    var app = express();

    stormpathExpress.init(app);
    stormpathExpress.prep(app);

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

    stormpathExpress.init(app);
    stormpathExpress.prep(app);

    fs.unlinkSync(apiKeyFile);

    if (fs.existsSync(apiKeyFileBackup)) {
      fs.renameSync(apiKeyFileBackup, apiKeyFile);
    }

    assert.equal(app.get('stormpathApiKeyFile'), apiKeyFile);
  });
});

describe('validate', function() {
  it('should throw an error if no api key file is specified', function() {
    var app = express();

    stormpathExpress.init(app, { apiKeySecret: 'xxx' });

    assert.throws(
      function() {
        stormpathExpress.validate(app);
      },
      Error
    );
  });

  it('should throw an error if an invalid api key file is specified', function() {
    var app = express();

    stormpathExpress.init(app, { apiKeyFile: 'woooo' });

    assert.throws(
      function() {
        stormpathExpress.validate(app);
      },
      Error
    );
  });
});
