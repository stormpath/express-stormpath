'use strict';

var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var WidgetFixture = require('../fixtures/widget-fixture');
var SpaRootFixture = require('../fixtures/spa-root-fixture');

describe('email verification', function () {
  var expressApp;
  var stormpathApplication;

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;

      helpers.setEmailVerificationStatus(stormpathApplication, 'ENABLED', function (err) {
        if (err) {
          return done(err);
        }
        expressApp = helpers.createStormpathExpressApp({
          application: stormpathApplication,
          web: {
            register: {
              enabled: true
            }
          }
        });
        expressApp.on('stormpath.ready', done);
      });
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  describe('If I ask for a new email verificaion token', function () {
    describe('and I submit an invalid email address', function () {
      describe('the JSON response', function () {
        it('should send me an error object', function (done) {
          var config = expressApp.get('stormpathConfig');
          request(expressApp)
            .post(config.web.verifyEmail.uri)
            .send({
              login: uuid()
            })
            .set('Accept', 'application/json')
            .expect(200, '', done);
        });
      });
    });

    describe('and I omit the login field property', function () {
      describe('the JSON response', function () {
        it('should send me an error object', function (done) {
          var config = expressApp.get('stormpathConfig');
          request(expressApp)
            .post(config.web.verifyEmail.uri)
            .set('Accept', 'application/json')
            .expect(400, '{"status":400,"message":"login property is required; it cannot be null, empty, or blank."}', done);
        });
      });
    });
  });

  describe('if given an invalid token', function () {
    it('should respond with an error message as JSON', function (done) {
      var config = expressApp.get('stormpathConfig');
      request(expressApp)
        .get(config.web.verifyEmail.uri + '?sptoken=invalidtoken')
        .set('Accept', 'application/json')
        .expect(404, '{"status":404,"message":"The requested resource does not exist."}', done);
    });
  });

  describe('GET /verify with accept text/html', () => {
    var widgetFixture;
    var testResponse;

    before(function (done) {
      widgetFixture = new WidgetFixture('showEmailVerification');

      var config = expressApp.get('stormpathConfig');

      request(expressApp)
        .get(config.web.verifyEmail.uri)
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

    it('should return a widget html response', () => {
      widgetFixture.assertResponse(testResponse);
    });
  });

  describe('if configured with a SPA root', function () {
    var spaRootFixture;

    before(function (done) {
      spaRootFixture = new SpaRootFixture({
        application: {
          href: stormpathApplication.href
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
          .get(config.web.verifyEmail.uri)
          .set('Accept', 'text/html')
          .expect(200)
          .end(spaRootFixture.assertResponse(done));
      });
    });
  });
});