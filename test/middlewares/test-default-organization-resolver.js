'use strict';

var helpers = require('../helpers');
var middlewares = require('../../lib/middleware/');
var bodyParser = require('../../lib/helpers/body-parser');
var getHost = require('../../lib/helpers/get-host');
var assert = require('assert');
var cookieParser = require('cookie-parser');
var parseDomain = require('psl').parse;
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

var fakeOrganization = {
  name: 'Really cool organization'
};

var fakeConfig;

function createFakeExpressApp(customResolver) {
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
        enabled: true,
        strategy: 'subdomain',
        organizationResolver: middlewares.defaultOrganizationResolver
      }
    }
  });

  if (customResolver) {
    fakeConfig.web.multiTenancy.organizationResolver = customResolver;
  }

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

  app.use(fakeConfig.web.multiTenancy.organizationResolver);

  app.use('/', function (req, res) {
    res.json({
      organization: req.organization
    });
  });

  return app;
}

function customOrganizationResolver(req, res, next) {
  var currentHost = parseDomain(getHost(req, true));
  if (currentHost.subdomain) {
    req.organization = fakeOrganization;
  }

  next();
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

          // Create a mapping, because unmapped orgs are rejected
          stormpathApplication.createAccountStoreMapping(
            {accountStore: stormpathOrganization},
            function (err) {
              done(err);
            }
          );
        });
      });
    });

    after(function (done) {
      helpers.destroyApplication(stormpathApplication, done);
    });

    describe('from sub domain', function () {
      it('should set req.organization', function (done) {
        fakeConfig.web.multiTenancy.strategy = 'subdomain';

        request(expressApp)
          .get('/')
          .set('Host', stormpathOrganization.nameKey + '.localhost.com')
          .expect(200)
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

    describe('with no application mapping', function () {
      var otherOrg;

      before(function (done) {
        helpers.createOrganization(stormpathClient, function (err, org) {
          if (err) {
            return done(err);
          }

          otherOrg = org;
          done();
        });
      });

      after(function (done) {
        otherOrg.delete(done);
      });

      it('should not set req.organization to this org', function (done) {
        fakeConfig.web.multiTenancy.strategy = 'subdomain';

        request(expressApp)
          .get('/')
          .set('Host', otherOrg.nameKey + '.localhost.com')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var result = JSON.parse(res.text);

            assert(!!result);
            assert(!result.organization);
            done();
          });
      });
    });

    describe('from access token in cookie', function () {

      it('should set req.organization from the access token value', function (done) {

        var apiKey = stormpathApplication.dataStore.requestExecutor.options.client.apiKey.secret;
        var cookieName = fakeConfig.web.accessTokenCookie.name;

        var mockPayload = {
          org: stormpathOrganization.href
        };

        var mockCookieJwt = nJwt.create(mockPayload, apiKey, 'HS256');
        mockCookieJwt.header.kid = 'f8fdb5c5-6e04-42db-85d8-47b1773c83d0';

        request(expressApp)
          .get('/')
          .set('Host', stormpathOrganization.nameKey + '.localhost.com')
          .set('Cookie', [cookieName + '=' + mockCookieJwt.toString()])
          .expect(200)
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

  describe('with custom organization resolver', function () {
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
          expressApp = createFakeExpressApp(customOrganizationResolver);
          done();
        });
      });
    });

    after(function (done) {
      helpers.destroyApplication(stormpathApplication, done);
    });

    it('should call the custom resolver', function (done) {
      fakeConfig.web.multiTenancy.strategy = 'subdomain';

      request(expressApp)
          .get('/')
          .set('Host', stormpathOrganization.nameKey + '.localhost.com')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var result = JSON.parse(res.text);

            assert(!!result);
            assert(!!result.organization);
            assert.deepEqual(result.organization, fakeOrganization);

            done();
          });
    });
  });

});