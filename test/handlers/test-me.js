'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

function prepateMeTestFixture(stormpathApplication, cb) {

  var app = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    web: {
      me: {
        expand: {
          customData: true
        }
      }
    }
  });

  var fixture = {
    expressApp: app
  };

  app.on('stormpath.ready', cb.bind(null, fixture));
}

describe('current user (/me) route', function () {

  var newUser = helpers.newUser();
  var stormpathApplication = null;

  newUser.customData = {
    favoriteColor: uuid.v4()
  };

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      app.createAccount(newUser, done);
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should respond with the expanded account object and force no cache', function (done) {
    prepateMeTestFixture(stormpathApplication, function (fixture) {
      var agent = request.agent(fixture.expressApp);
      agent
        .post('/login')
        .set('Accept', 'application/json')
        .type('json')
        .send({username: newUser.email, password: newUser.password})
        .end(function (err) {
          if (err) {
            return done(err);
          }
          /**
           * The agent now has the cookies that will allow us to request the
           * /me route
           */
          agent
            .get('/me')
            .expect('cache-control', 'no-store, no-cache')
            .expect('pragma', 'no-cache')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              // assert.equal(res.header['cache-control'], 'no-store, no-cache');
              // assert.equal(res.header['pragma'], 'no-cache');
              // Custom data should have been expanded:
              assert(res.body.customData.favoriteColor === newUser.customData.favoriteColor);

              // All other properties should be stripped

              assert.equal(res.body.accessTokens, undefined);
              assert.equal(res.body.apiKeys, undefined);
              assert.equal(res.body.applications, undefined);
              assert.equal(res.body.directory, undefined);
              assert.equal(res.body.emailVerificationToken, undefined);
              assert.equal(res.body.groupMemberships, undefined);
              assert.equal(res.body.groups, undefined);
              assert.equal(res.body.providerData, undefined);
              assert.equal(res.body.refreshTokens, undefined);
              assert.equal(res.body.tenant, undefined);
              done();
            });
        });
    });
  });
});