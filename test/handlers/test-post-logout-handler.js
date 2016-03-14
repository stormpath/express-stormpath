'use strict';

var sinon = require('sinon');
var assert = require('assert');
var request = require('supertest');

var helpers = require('../helpers');

function postLogoutHandlerSpyTestFixture(sandbox, application, account, callback) {
  var fixture = {
    postLogoutHandlerSpy: sandbox.spy(function (formData, req, res, next) {
      next();
    })
  };

  var app = helpers.createStormpathExpressApp({
    application: application,
    postLogoutHandler: fixture.postLogoutHandlerSpy
  }, function (req, res, next) {
    req.user = account;
    next();
  });

  fixture.expressApp = app;

  app.on('stormpath.ready', callback.bind(null, fixture));
}

describe('Post-Logout Handler', function () {
  var sandbox;
  var application = null;
  var account;
  var newUser = helpers.newUser();

  before(function (done) {
    sandbox = sinon.sandbox.create();

    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      application = app;

      application.createAccount(newUser, function (err, newAccount) {
        if (err) {
          return done(err);
        }

        account = newAccount;

        done();
      });
    });
  });

  after(function (done) {
    sandbox.restore();
    helpers.destroyApplication(application, done);
  });

  describe('when calling POST /logout', function () {
    describe('with a postLogoutHandler', function () {
      describe('the handler', function () {
        var postLogoutHandlerSpy;

        before(function (done) {
          postLogoutHandlerSpyTestFixture(sandbox, application, account, function (fixture) {
            request(fixture.expressApp)
              .post('/logout')
              .set('Accept', 'application/json')
              .expect(200)
              .end(function (err) {
                if (err) {
                  return done(err);
                }

                postLogoutHandlerSpy = fixture.postLogoutHandlerSpy;

                done();
              });
          });
        });

        it('should be called once', function () {
          assert(postLogoutHandlerSpy.calledOnce);
        });

        it('should have the first argument be the account object', function () {
          var firstArgument = postLogoutHandlerSpy.getCall(0).args[0];

          assert(typeof firstArgument === 'object');
          assert(Object.keys(firstArgument).length === Object.keys(account).length);

          for (var key in account) {
            assert(firstArgument[key] === account[key]);
          }
        });

        it('should have the second argument be the request object', function () {
          var secondArgument = postLogoutHandlerSpy.getCall(0).args[1];
          assert(typeof secondArgument === 'object');
          assert(typeof secondArgument.body === 'object');
          assert(typeof secondArgument.query === 'object');
          assert(typeof secondArgument.method === 'string');
          assert(typeof secondArgument.path === 'string');
        });

        it('should have the third argument be the response object', function () {
          var thirdArgument = postLogoutHandlerSpy.getCall(0).args[2];
          assert(typeof thirdArgument === 'object');
          assert(typeof thirdArgument.json === 'function');
          assert(typeof thirdArgument.write === 'function');
          assert(typeof thirdArgument.end === 'function');
        });

        it('should have the fourth argument be the next callback', function () {
          var fourthArgument = postLogoutHandlerSpy.getCall(0).args[3];
          assert(typeof fourthArgument === 'function');
        });
      });
    });
  });
});