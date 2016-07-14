'use strict';

var sinon = require('sinon');
var assert = require('assert');
var request = require('supertest');

var helpers = require('../helpers');

function preLoginHandlerSpyTestFixture(sandbox, application, callback) {
  var fixture = {
    preLoginHandlerSpy: sandbox.spy(function (formData, req, res, next) {
      next();
    })
  };

  var app = helpers.createStormpathExpressApp({
    application: application,
    preLoginHandler: fixture.preLoginHandlerSpy
  });

  fixture.expressApp = app;

  app.on('stormpath.ready', callback.bind(null, fixture));
}

function preLoginHandlerErrorTestFixture(application, respondWithError, callback) {
  var app = helpers.createStormpathExpressApp({
    application: application,
    preLoginHandler: function (formData, req, res, next) {
      next(respondWithError);
    }
  });

  var fixture = {
    expressApp: app
  };

  app.on('stormpath.ready', callback.bind(null, fixture));
}

function preLoginHandlerInterceptResponseTestFixture(application, callback) {
  var fixture = {
    expressApp: null,
    preLoginHandlerFormData: null
  };

  var app = helpers.createStormpathExpressApp({
    application: application,
    preLoginHandler: function (formData, req, res, next) {
      fixture.preLoginHandlerFormData = formData;
      next();
    }
  });

  fixture.expressApp = app;

  app.on('stormpath.ready', callback.bind(null, fixture));
}

describe('Pre-Login Handler', function () {
  var sandbox;
  var application = null;
  var usernamePasswordBody;
  var newUser = helpers.newUser();

  before(function (done) {
    sandbox = sinon.sandbox.create();

    usernamePasswordBody = {
      username: newUser.email,
      password: newUser.password
    };

    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      application = app;

      application.createAccount(newUser, done);
    });
  });

  after(function (done) {
    sandbox.restore();
    helpers.destroyApplication(application, done);
  });

  describe('when calling POST /login', function () {
    describe('with a preLoginHandler', function () {
      describe('the handler', function () {
        var preLoginHandlerSpy;

        before(function (done) {
          preLoginHandlerSpyTestFixture(sandbox, application, function (fixture) {
            request(fixture.expressApp)
              .post('/login')
              .set('Accept', 'application/json')
              .type('json')
              .send(usernamePasswordBody)
              .expect('Set-Cookie', /access_token=[^;]+/)
              .expect(200)
              .end(function (err) {
                if (err) {
                  return done(err);
                }

                preLoginHandlerSpy = fixture.preLoginHandlerSpy;

                done();
              });
          });
        });

        it('should be called once', function () {
          assert(preLoginHandlerSpy.calledOnce);
        });

        it('should have the first argument be the formData object', function () {
          var firstArgument = preLoginHandlerSpy.getCall(0).args[0];
          assert(typeof firstArgument === 'object');
          assert(firstArgument.grant_type === 'password');
          assert(firstArgument.username === newUser.email);
          assert(firstArgument.password === newUser.password);
        });

        it('should have the second argument be the request object', function () {
          var secondArgument = preLoginHandlerSpy.getCall(0).args[1];
          assert(typeof secondArgument === 'object');
          assert(typeof secondArgument.body === 'object');
          assert(typeof secondArgument.query === 'object');
          assert(typeof secondArgument.method === 'string');
          assert(typeof secondArgument.path === 'string');
        });

        it('should have the third argument be the response object', function () {
          var thirdArgument = preLoginHandlerSpy.getCall(0).args[2];
          assert(typeof thirdArgument === 'object');
          assert(typeof thirdArgument.json === 'function');
          assert(typeof thirdArgument.write === 'function');
          assert(typeof thirdArgument.end === 'function');
        });

        it('should have the fourth argument be the next callback', function () {
          var fourthArgument = preLoginHandlerSpy.getCall(0).args[3];
          assert(typeof fourthArgument === 'function');
        });

        describe('when providing your own response', function () {
          it('should return that response', function (done) {
            preLoginHandlerInterceptResponseTestFixture(application, function (fixture) {
              request(fixture.expressApp)
                .post('/login')
                .set('Accept', 'application/json')
                .type('json')
                .send(usernamePasswordBody)
                .expect(200)
                .end(function (err) {
                  if (err) {
                    return done(err);
                  }

                  var preLoginHandlerFormData = fixture.preLoginHandlerFormData;

                  assert(typeof preLoginHandlerFormData === 'object');
                  assert(preLoginHandlerFormData.grant_type === 'password');
                  assert(preLoginHandlerFormData.username === usernamePasswordBody.username);
                  assert(preLoginHandlerFormData.password === usernamePasswordBody.password);

                  done();
                });
            });
          });
        });

        describe('when calling next(err)', function () {
          var expressApp, respondWithError;

          before(function (done) {
            respondWithError = new Error('54e3ea32-3366-4a25-a774-53fd93b1746e');
            preLoginHandlerErrorTestFixture(application, respondWithError, function (fixture) {
              expressApp = fixture.expressApp;
              done();
            });
          });

          it('should write the error to the response', function (done) {
            request(expressApp)
              .post('/login')
              .set('Accept', 'application/json')
              .type('json')
              .send(usernamePasswordBody)
              .expect(400)
              .end(function (err, res) {
                if (err) {
                  return done(err);
                }

                assert(typeof res.body === 'object');
                assert(res.body.status === 400);
                assert(res.body.message === respondWithError.message);

                done();
              });
          });
        });
      });
    });
  });
});