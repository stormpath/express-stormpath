'use strict';

var sinon = require('sinon');
var assert = require('assert');
var request = require('supertest');

var helpers = require('../helpers');

function preRegistrationHandlerSpyTestFixture(sandbox, application, callback) {
  var fixture = {
    preRegistrationHandlerSpy: sandbox.spy(function (formData, req, res, next) {
      next();
    })
  };

  var app = helpers.createStormpathExpressApp({
    application: application,
    preRegistrationHandler: fixture.preRegistrationHandlerSpy
  });

  fixture.expressApp = app;

  app.on('stormpath.ready', callback.bind(null, fixture));
}

function preRegistrationHandlerErrorTestFixture(application, respondWithError, callback) {
  var app = helpers.createStormpathExpressApp({
    application: application,
    preRegistrationHandler: function (formData, req, res, next) {
      next(respondWithError);
    }
  });

  var fixture = {
    expressApp: app
  };

  app.on('stormpath.ready', callback.bind(null, fixture));
}

function preRegistrationHandlerInterceptResponseTestFixture(application, respondWith, callback) {
  var app = helpers.createStormpathExpressApp({
    application: application,
    preRegistrationHandler: function (formData, req, res) {
      res.json(respondWith);
      res.end();
    }
  });

  var fixture = {
    expressApp: app
  };

  app.on('stormpath.ready', callback.bind(null, fixture));
}

describe('Pre-Registration Handler', function () {
  var sandbox;
  var application = null;
  var newUser = helpers.newUser();

  before(function (done) {
    sandbox = sinon.sandbox.create();

    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      application = app;

      done();
    });
  });

  after(function (done) {
    sandbox.restore();
    helpers.destroyApplication(application, done);
  });

  describe('when calling POST /register', function () {
    describe('with a preRegistrationHandler', function () {
      describe('the handler', function () {
        var preRegistrationHandlerSpy;

        before(function (done) {
          preRegistrationHandlerSpyTestFixture(sandbox, application, function (fixture) {
            request(fixture.expressApp)
              .post('/register')
              .set('Accept', 'application/json')
              .type('json')
              .send(newUser)
              .expect(200)
              .end(function (err) {
                if (err) {
                  return done(err);
                }

                preRegistrationHandlerSpy = fixture.preRegistrationHandlerSpy;

                done();
              });
          });
        });

        it('should be called once', function () {
          assert(preRegistrationHandlerSpy.calledOnce);
        });

        it('should have the first argument be the formData object', function () {
          var firstArgument = preRegistrationHandlerSpy.getCall(0).args[0];

          assert(typeof firstArgument === 'object');
          assert(Object.keys(firstArgument).length === Object.keys(newUser).length);

          for (var key in newUser) {
            assert(firstArgument[key] === newUser[key]);
          }
        });

        it('should have the second argument be the request object', function () {
          var secondArgument = preRegistrationHandlerSpy.getCall(0).args[1];
          assert(typeof secondArgument === 'object');
          assert(typeof secondArgument.body === 'object');
          assert(typeof secondArgument.query === 'object');
          assert(typeof secondArgument.method === 'string');
          assert(typeof secondArgument.path === 'string');
        });

        it('should have the third argument be the response object', function () {
          var thirdArgument = preRegistrationHandlerSpy.getCall(0).args[2];
          assert(typeof thirdArgument === 'object');
          assert(typeof thirdArgument.json === 'function');
          assert(typeof thirdArgument.write === 'function');
          assert(typeof thirdArgument.end === 'function');
        });

        it('should have the fourth argument be the next callback', function () {
          var fourthArgument = preRegistrationHandlerSpy.getCall(0).args[3];
          assert(typeof fourthArgument === 'function');
        });

        describe('when providing your own response', function () {
          var expressApp, customResponse;

          before(function (done) {
            customResponse = { test: 'bea99bcd-05e5-4870-a0df-ec7aae996596' };
            preRegistrationHandlerInterceptResponseTestFixture(application, customResponse, function (fixture) {
              expressApp = fixture.expressApp;
              done();
            });
          });

          it('should return that response', function (done) {
            request(expressApp)
              .post('/register')
              .set('Accept', 'application/json')
              .type('json')
              .send(newUser)
              .expect(200)
              .end(function (err, res) {
                if (err) {
                  return done(err);
                }

                assert(typeof res.body === 'object');
                assert(res.body.test === customResponse.test);

                done();
              });
          });
        });

        describe('when calling next(err)', function () {
          var expressApp, respondWithError;

          before(function (done) {
            respondWithError = new Error('499d8376-c5db-4bb5-a175-562888c6dcef');
            preRegistrationHandlerErrorTestFixture(application, respondWithError, function (fixture) {
              expressApp = fixture.expressApp;
              done();
            });
          });

          it('should write the error to the response', function (done) {
            request(expressApp)
              .post('/register')
              .set('Accept', 'application/json')
              .type('json')
              .send(newUser)
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