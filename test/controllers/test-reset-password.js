'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var WidgetFixture = require('../fixtures/widget-fixture');
var SpaRootFixture = require('../fixtures/spa-root-fixture');

function requestResetPage(app, sptoken) {
  var config = app.get('stormpathConfig');
  return request(app)
    .get(config.web.changePassword.uri + (sptoken ? ('?sptoken=' + sptoken) : ''));
}

describe('resetPassword', function () {
  var defaultExpressApp;

  var passwordResetToken;
  var stormpathAccount;
  var stormpathApplication;
  var stormpathClient;

  before(function (done) {
    stormpathClient = helpers.createClient({

    });

    helpers.createApplication(stormpathClient, function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;

      app.createAccount(helpers.newUser(), function (err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;

        app.sendPasswordResetEmail({
          email: account.email
        }, function (err, tokenResource) {
          if (err) {
            return done(err);
          }

          passwordResetToken = tokenResource.href.match(/\/([^\/]+)$/)[1];

          defaultExpressApp = helpers.createStormpathExpressApp({
            application: stormpathApplication
          });

          defaultExpressApp.on('stormpath.ready', done);
        });
      });
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

  describe('GET /verify?sptoken=abc with accept text/html', function () {
    var widgetFixture;
    var testResponse;

    before(function (done) {
      widgetFixture = new WidgetFixture('showChangePassword');

      requestResetPage(defaultExpressApp, 'abc')
        .set('Accept', 'text/html')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          testResponse = res;

          done();
        });
    });

    it('should return a widget html response', function () {
      widgetFixture.assertResponse(testResponse);
    });
  });

  it('should disable password reset functionality if the directory has it disabled', function (done) {
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
        requestResetPage(app)
          .expect(404)
          .end(done);
      });
    });
  });

  it('should redirect to the /forgot view is no sptoken is given', function (done) {
    var config = defaultExpressApp.get('stormpathConfig');
    requestResetPage(defaultExpressApp)
      .expect(302)
      .expect('Location', config.web.forgotPassword.uri)
      .end(done);
  });

  describe('with an invalid token', function () {
    describe('as JSON', function () {
      it('should respond with an error object', function (done) {
        var config = defaultExpressApp.get('stormpathConfig');
        request(defaultExpressApp)
          .get(config.web.changePassword.uri + '?sptoken=foo')
          .set('Accept', 'application/json')
          .expect(404, {
            message: 'This password reset request does not exist. Please request a new password reset.',
            status: 404
          }, done);
      });
    });
  });

  describe('with a valid token', function () {
    var passwordResetToken;
    before(function (done) {
      stormpathApplication.sendPasswordResetEmail({
        email: stormpathAccount.email
      }, function (err, tokenResource) {
        if (err) {
          return done(err);
        }
        passwordResetToken = tokenResource.href.match(/\/([^\/]+)$/)[1];
        done();
      });
    });

    it('should allow me to verify the token with the JSON API', function (done) {
      var config = defaultExpressApp.get('stormpathConfig');
      request(defaultExpressApp)
        .get(config.web.changePassword.uri + '?sptoken=' + passwordResetToken)
        .set('Accept', 'application/json')
        .expect(200, '', done);
    });
  });

  it('should allow me to change the password, with a valid token, via the JSON api', function (done) {
    // Need to get another token because we consumed it in the last test
    stormpathApplication.sendPasswordResetEmail({
      email: stormpathAccount.email
    }, function (err, tokenResource) {
      if (err) {
        return done(err);
      }

      var passwordResetToken = tokenResource.href.match(/\/([^\/]+)$/)[1];

      var config = defaultExpressApp.get('stormpathConfig');
      var newPassword = uuid() + uuid().toUpperCase();

      request(defaultExpressApp)
        .post(config.web.changePassword.uri)
        .set('Accept', 'application/json')
        .send({
          password: newPassword,
          passwordAgain: newPassword,
          sptoken: passwordResetToken
        })
        .expect(200)
        .end(function () {
          // Assert that the password can be used to login.
          stormpathApplication.authenticateAccount({
            username: stormpathAccount.username,
            password: newPassword
          }, function (err) {
            assert.ifError(err);
            done();
          });
        });
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
          changePassword: {
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
        requestResetPage(app, passwordResetToken)
          .expect(200)
          .end(spaRootFixture.assertResponse(done));
      });
    });
  });
});