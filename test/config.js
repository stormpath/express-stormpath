'use strict';

var assert = require('assert');
var fs = require('fs');
var FakeFs = require('fake-fs');
var path = require('path');
var yaml = require('js-yaml');
var extend = require('xtend');

var helpers = require('./helpers');
var clientFactory = require('../lib/client');

var defaultConfigPath = path.resolve(__dirname, '../lib/config.yml');

function createHomeConfig(callback) {
  var client = helpers.createClient();
  helpers.createApplication(client, function (err, application) {
    if (err) {
      return callback(err);
    }

    application.createAccount(helpers.newUser(), function (err, account) {
      if (err) {
        return callback(err);
      }

      account.createApiKey(function (err, apiKey) {
        if (err) {
          return callback(err);
        }

        var config = {
          client: {
            apiKey: {
              id: apiKey.id,
              secret: apiKey.secret
            }
          },
          application: {
            href: application.href
          }
        };

        callback(null, {
          config: config,
          application: application
        });
      });
    });
  });
}

function cleanEnv() {
  var restore = helpers.snapshotEnv();

  for (var key in process.env) {
    if (key.indexOf('STORMPATH_') === 0) {
      delete process.env[key];
    }
  }

  return restore;
}

function getDefaultConfig() {
  return fs.readFileSync(defaultConfigPath);
}

function getDefaultYaml() {
  return yaml.load(getDefaultConfig(), 'utf-8');
}

function getClient(options, done) {
  var client = clientFactory(options || {});

  client.on('ready', function () {
    done();
  });

  client.on('error', done);

  return client;
}

function mockCommonPaths(fakeFs) {
  var dynamicRequires = [
    '/resource/Application.js',
    '/resource/ApplicationAccountStoreMapping.js',
    '/resource/AccountStoreMapping.js',
    '/resource/PasswordResetToken.js',
    '/authc/AuthRequestParser.js',
    '/authc/BasicApiAuthenticator.js',
    '/authc/OAuthBasicExchangeAuthenticator.js',
    '/error/messages.js'
  ];

  fakeFs.file(defaultConfigPath, {content: getDefaultConfig()});
  fakeFs.file(process.cwd() + '/node_modules/stormpath/lib/config.yml', {
    content: fs.readFileSync(process.cwd() + '/node_modules/stormpath/lib/config.yml')
  });

  dynamicRequires.forEach(function (filePath) {
    fakeFs.file(process.cwd() + '/node_modules/stormpath/lib' + filePath, {
      content: fs.readFileSync(process.cwd() + '/node_modules/stormpath/lib' + filePath)
    });
  });
}

describe('configuration loading', function () {
  var restoreEnv;
  var fakeFs;
  var homeConfig;
  var application;

  before(function (done) {
    createHomeConfig(function (err, data) {
      if (err) {
        return done(err);
      }

      homeConfig = data.config;
      application = data.application;
      done();
    });
  });

  after(function (done) {
    application.delete(done);
  });

  beforeEach(function () {
    restoreEnv = cleanEnv();

    if (fakeFs) {
      fakeFs.unpatch();
    }

    fakeFs = new FakeFs().bind();
  });

  afterEach(function () {
    restoreEnv();
  });

  describe('loading of default YAML configuration', function () {
    var yamlData;
    var client;

    beforeEach(function (done) {
      var config = extend({}, homeConfig, {skipRemoteConfig: true});
      yamlData = getDefaultYaml();
      client = getClient(config, done);

      mockCommonPaths(fakeFs);

      fakeFs.patch();
    });

    it('should contain the default configuration fields', function () {
      assert(helpers.contains(client.config, yamlData));
    });
  });

  describe('loading a custom stormpath.yml', function () {
    var client;

    beforeEach(function (done) {
      var config = extend({}, homeConfig, {skipRemoteConfig: true});
      mockCommonPaths(fakeFs);
      fakeFs.file(process.cwd() + '/stormpath.yml', {
        content: yaml.dump({
          web: {
            invented: {
              testable: true
            }
          }
        })
      });

      fakeFs.patch();

      client = getClient(config, done);
    });

    afterEach(function () {
      fakeFs.unpatch();
    });

    it('should contain the loaded data', function () {
      assert('web' in client.config);
      assert('invented' in client.config.web);
      assert('testable' in client.config.web.invented);
      assert.equal(client.config.web.invented.testable, true);
    });
  });

  describe('loading of custom stormpath.json', function () {
    var client;

    beforeEach(function (done) {
      var config = extend({}, homeConfig, {skipRemoteConfig: true});
      mockCommonPaths(fakeFs);
      fakeFs.file(process.cwd() + '/stormpath.json', {
        content: JSON.stringify({
          web: {
            invented: {
              untestable: 'yeah'
            }
          }
        })
      });

      fakeFs.patch();

      client = getClient(config, done);
    });

    afterEach(function () {
      fakeFs.unpatch();
    });

    it('should contain the loaded data', function () {
      assert('web' in client.config);
      assert('invented' in client.config.web);
      assert('untestable' in client.config.web.invented);
      assert.equal(client.config.web.invented.untestable, 'yeah');
    });
  });

  describe('loading configuration from the environment', function () {
    var client;

    beforeEach(function (done) {
      process.env.STORMPATH_CLIENT_APIKEY_ID = homeConfig.client.apiKey.id;
      process.env.STORMPATH_CLIENT_APIKEY_SECRET = homeConfig.client.apiKey.secret;
      process.env.STORMPATH_APPLICATION_HREF = application.href;

      var config = extend({}, {skipRemoteConfig: true});
      mockCommonPaths(fakeFs);

      fakeFs.patch();

      client = getClient(config, done);
    });

    afterEach(function () {
      fakeFs.unpatch();
    });

    it('should load the configuration from the environment', function () {
      assert('client' in client.config);
      assert('apiKey' in client.config.client);
      assert.equal(client.config.client.apiKey.id, homeConfig.client.apiKey.id);
      assert.equal(client.config.client.apiKey.secret, homeConfig.client.apiKey.secret);

      assert('application' in client.config);
      assert.equal(client.config.application.href, homeConfig.application.href);
    });
  });

  describe('loading configuration from .init()', function () {
    var client;
    var extraInitConfig;

    beforeEach(function (done) {
      extraInitConfig = {
        web: {
          initStuff: {
            name: 'some very good name'
          }
        }
      };

      var config = extend(extraInitConfig, homeConfig, {skipRemoteConfig: true});
      mockCommonPaths(fakeFs);

      fakeFs.patch();

      client = getClient(config, done);
    });

    afterEach(function () {
      fakeFs.unpatch();
    });

    it('should load the configuration from the config init object', function () {
      assert('initStuff' in client.config.web);
      assert.equal(client.config.web.initStuff.name, extraInitConfig.web.initStuff.name);
    });
  });

  describe('loading configuration that is resolved at runtime', function () {

  });

  describe('detecting invalid configurations', function () {
    it('should abort if the stormpath id is not specified', function () {

    });

    it('should abort if the stormpath secret is not specified', function () {

    });

    it('should abort if the application id is not specified', function () {

    });
  });
});