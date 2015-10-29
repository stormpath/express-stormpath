'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

function preparePostLoginExpansionTestFixture(stormpathApplication,cb) {

  var app = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    website: true,
    expand: {
      customData: true
    },
    postLoginHandler: function (account,req,res) {
      // Simply return the user object, so that we can
      // assert that the custom data was expanded
      res.json(account);
    }
  });

  var fixture = {
    expressApp: app
  };

  app.on('stormpath.ready', cb.bind(null,fixture));
}

function preparePostLoginPassThroughTestFixture(stormpathApplication,cb) {

  var sideEffectData = uuid.v4();

  var fixture = {
    expressApp: null,
    sideEffectData: sideEffectData,
    sideEffect: null
  };

  fixture.expressApp = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    website: true,
    postLoginHandler: function (account,req,res,next) {
      fixture.sideEffect = sideEffectData;
      next();
    }
  });

  fixture.expressApp.on('stormpath.ready', cb.bind(null,fixture));
}

describe('Post-Login Handler', function () {

  var stormpathApplication = null;
  var newUser = helpers.newUser();

  newUser.customData = {
    favoriteColor: uuid.v4()
  };

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      stormpathApplication.createAccount(newUser,done);
    });
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  describe('with a JSON post', function () {
    it('should be given the expanded account object', function (done) {
      preparePostLoginExpansionTestFixture(stormpathApplication, function (fixture) {
        request(fixture.expressApp)
          .post('/login')
          .set('Accept', 'application/json')
          .type('json')
          .send({username: newUser.email, password: newUser.password})
          .expect('Set-Cookie', /access_token=[^;]+/)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert(res.body.customData.favoriteColor === newUser.customData.favoriteColor);
            done();
          });
      });
    });

    it('should allow me to do work, then call next (let framework end the response)', function (done) {

      preparePostLoginPassThroughTestFixture(stormpathApplication, function (fixture) {
        request(fixture.expressApp)
          .post('/login')
          .set('Accept', 'application/json')
          .type('json')
          .send({username: newUser.email, password: newUser.password})
          .expect('Set-Cookie', /access_token=[^;]+/)
          .expect(200)
          .end(function (err) {
            if (err) {
              return done(err);
            }

            assert(fixture.sideEffect === fixture.sideEffectData);
            done();
          });
      });
    });
  });

  describe('with a Form-Encoded post', function () {

    it('should be given the expanded account object', function (done) {

      preparePostLoginExpansionTestFixture(stormpathApplication, function (fixture) {
        request(fixture.expressApp)
          .post('/login')
          .send({login: newUser.email, password: newUser.password})
          .expect('Set-Cookie', /access_token=[^;]+/)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert(res.body.customData.favoriteColor === newUser.customData.favoriteColor);
            done();
          });
      });
    });

    it('should allow me to do work, then call next (let framework end the response)', function (done) {

      preparePostLoginPassThroughTestFixture(stormpathApplication, function (fixture) {
        request(fixture.expressApp)
          .post('/login')
          .send({login: newUser.email, password: newUser.password})
          .expect('Set-Cookie', /access_token=[^;]+/)
          .expect(302)
          .end(function (err) {
            if (err) {
              return done(err);
            }
            assert(fixture.sideEffect === fixture.sideEffectData);
            done();
          });
      });
    });
  });
});