'use strict';

var helpers = require('../helpers');
var middlewares = require('../../lib/middleware/');
var bodyParser = require('../../lib/helpers/body-parser');
var assert = require('assert');
var cookieParser = require('cookie-parser');
var deepExtend = require('deep-extend');
var express = require('express');
var fs = require('fs');
var path = require('path');
var request = require('supertest');
var winston = require('winston');
var yaml = require('js-yaml');
var nJwt = require('njwt');

var expressApp;
var stormpathClient;
var stormpathApplication;
var stormpathOrganization;

var fakeConfig;
var fakeRequestHost;

function createFakeExpressApp() {
  var app = express();

  var defaultSdkConfig = yaml.load(fs.readFileSync(path.join(path.dirname(require.resolve('stormpath')), 'config.yml'), 'utf8'));
  var defaultIntegrationConfig = yaml.load(fs.readFileSync('./lib/config.yml', 'utf8'));

  fakeConfig = deepExtend({}, defaultSdkConfig);
  fakeConfig = deepExtend(fakeConfig, defaultIntegrationConfig);

  deepExtend(fakeConfig, {
    client: {
      apiKey: {
        id: '123',
        secret: '123'
      }
    },
    application: {
      href: stormpathApplication.href
    },
    web: {
      domainName: 'localhost.com',
      multiTenancy: {
        enabled: true
      }
    }
  });

  app.set('stormpathConfig', fakeConfig);
  app.set('stormpathApplication', stormpathApplication);
  app.set('stormpathClient', stormpathClient);
  app.set('stormpathLogger', new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true,
        level: 'error'
      })
    ]
  }));

  app.use(bodyParser.formOrJson());
  app.use(cookieParser('mocksecret'));

  app.use(function (req, res, next) {
    if (fakeRequestHost) {
      req.headers.host = fakeRequestHost;
    }

    req.app = app;

    next();
  });

  app.use(middlewares.defaultOrganizationResolver);

  app.use('/', function (req, res) {
    res.json({
      organization: req.organization
    });
  });

  return app;
}

describe('middlewares.defaultOrganizationResolver', function () {
  describe('when organization is provided', function () {
    before(function (done) {
      stormpathClient = helpers.createClient();

      helpers.createApplication(stormpathClient, function (err, application) {
        if (err) {
          return done(err);
        }

        stormpathApplication = application;

        helpers.createOrganization(stormpathClient, function (err, organization) {
          if (err) {
            return done(err);
          }

          stormpathOrganization = organization;
          expressApp = createFakeExpressApp();

          done();
        });
      });
    });

    after(function (done) {
      helpers.destroyApplication(stormpathApplication, done);
    });

    describe('from sub domain', function () {
      it('should set req.organization', function (done) {
        fakeConfig.web.multiTenancy.useSubdomain = true;
        fakeRequestHost = stormpathOrganization.nameKey + '.localhost.com';

        function restoreConfig() {
          fakeRequestHost = null;
          fakeConfig.web.multiTenancy.useSubdomain = false;
        }

        request(expressApp)
          .get('/')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            restoreConfig();

            var result = JSON.parse(res.text);

            assert(!!result);
            assert(!!result.organization);
            assert.equal(result.organization.href, stormpathOrganization.href);

            done();
          });
      });
    });

    describe('from access token in cookie', function () {
      it('should set req.organization', function (done) {
        fakeRequestHost = null;

        var apiKey = stormpathApplication.dataStore.requestExecutor.options.client.apiKey.secret;
        var cookieName = fakeConfig.web.accessTokenCookie.name;

        var mockPayload = {
          org: stormpathOrganization.href
        };

        var mockCookieJwt = nJwt.create(mockPayload, apiKey, 'HS256');
        mockCookieJwt.header.kid = 'f8fdb5c5-6e04-42db-85d8-47b1773c83d0';

        request(expressApp)
          .get('/')
          .expect(200)
          .set('Cookie', [cookieName + '=' + mockCookieJwt.toString()])
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var result = JSON.parse(res.text);

            assert(!!result);
            assert(!!result.organization);
            assert.equal(result.organization.href, stormpathOrganization.href);

            done();
          });
      });
    });
  });
});