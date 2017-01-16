'use strict';

var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var WidgetFixture = require('../fixtures/widget-fixture');
var SpaRootFixture = require('../fixtures/spa-root-fixture');

describe('forgotPassword', function () {
  var stormpathApplication;
  var stormpathClient;

  before(function (done) {
    stormpathClient = helpers.createClient();
    helpers.createApplication(stormpathClient, function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      done();
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  afterEach(function (done) {
    helpers.setPasswordResetStatus(stormpathApplication, 'ENABLED', function (err) {
      done(err);
    });
  });

  it('should disable forgot password functionality if the directory has it disabled', function (done) {
    helpers.setPasswordResetStatus(stormpathApplication, 'DISABLED', function (err) {
      if (err) {
        return done(err);
      }

      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        }
      });

      app.on('stormpath.ready', function () {
        var config = app.get('stormpathConfig');
        request(app)
          .get(config.web.forgotPassword.uri)
          .expect(404)
          .end(done);
      });
    });
  });

  describe('as json', function () {
    it('should respond with 200 if a valid email is given', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          forgotPassword: {
            enabled: true
          }
        }
      });

      app.on('stormpath.ready', function () {
        request(app)
          .post('/forgot')
          .set('Accept', 'application/json')
          .type('json')
          .send({
            email: uuid.v4() + '@stormpath.com'
          })
          .expect(200, done);
      });
    });
  });

  describe('GET /verify with accept text/html', function () {
    var widgetFixture;
    var testResponse;

    before(function (done) {
      widgetFixture = new WidgetFixture('showForgotPassword');

      var expressApp = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          forgotPassword: {
            enabled: true
          }
        }
      });

      expressApp.on('stormpath.ready', function () {
        var config = expressApp.get('stormpathConfig');
        request(expressApp)
          .get(config.web.forgotPassword.uri)
          .set('Accept', 'text/html')
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }

            testResponse = res;

            done();
          });
      });
    });

    it('should return a widget html response', function () {
      widgetFixture.assertResponse(testResponse);
    });
  });

  describe('if configured with a SPA root', function () {
    var spaRootFixture;

    before(function (done) {
      spaRootFixture = new SpaRootFixture({
        application: {
          href: stormpathApplication.href
        },
        web: {
          forgotPassword: {
            enabled: true
          }
        }
      });
      spaRootFixture.before(done);
    });

    after(function (done) {
      spaRootFixture.after(done);
    });

    it('should return the SPA root', function (done) {
      var app = spaRootFixture.expressApp;

      app.on('stormpath.ready', function () {
        var config = app.get('stormpathConfig');
        request(app)
          .get(config.web.forgotPassword.uri)
          .set('Accept', 'text/html')
          .expect(200)
          .end(spaRootFixture.assertResponse(done));
      });
    });
  });
});