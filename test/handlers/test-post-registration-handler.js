'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

function preparePostRegistrationExpansionTestFixture(stormpathApplication,cb){

  var newAccount = helpers.newUser();

  newAccount.favoriteColor = uuid.v4();

  var app = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    website: true,
    expand: {
      customData: true
    },
    postRegistrationHandler: function(account,req,res){
      // Simply return the user object, so that we can
      // assert that the custom data was expanded
      res.json(account);
    }
  });

  var fixture = {
    expressApp: app,
    newAccountObject: newAccount
  };

  app.on('stormpath.ready', cb.bind(null,fixture));
}

function preparePostRegistrationPassThroughTestFixture(stormpathApplication,cb){

  var newAccount = helpers.newUser();

  var sideEffectData = uuid.v4();

  var app = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    website: true,
    postRegistrationHandler: function(account,req,res,next){
      fixture.sideEffect = sideEffectData;
      next();
    }
  });

  var fixture = {
    expressApp: app,
    newAccountObject: newAccount,
    sideEffectData: sideEffectData,
    sideEffect: null
  };

  app.on('stormpath.ready', cb.bind(null,fixture));
}

function preparePostRegistrationAutoLoginTestFixture(stormpathApplication,cb){

  var newAccount = helpers.newUser();

  var sideEffectData = uuid.v4();

  var app = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    web:{
      register: {
        enabled: true,
        autoLogin: true
      }
    },
    postRegistrationHandler: function(account,req,res,next){
      fixture.sideEffect = sideEffectData;
      next();
    }
  });

  var fixture = {
    expressApp: app,
    newAccountObject: newAccount,
    sideEffectData: sideEffectData,
    sideEffect: null
  };

  app.on('stormpath.ready', cb.bind(null,fixture));
}

describe('Post-Registration Handler',function() {
  var stormpathApplication = null;
  before(function(done) {

    helpers.createApplication(helpers.createClient(), function(err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      done();
    });
  });

  describe('with a JSON post',function(){

    it('should be given the expanded account object',function(done){

      preparePostRegistrationExpansionTestFixture(stormpathApplication,function(fixture){
        request(fixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(fixture.newAccountObject)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            assert(res.body.customData.favoriteColor === fixture.newAccountObject.favoriteColor);
            done();
          });
      });
    });

    it('should allow me to do work, then call next (let framework end the response)',function(done){

      preparePostRegistrationPassThroughTestFixture(stormpathApplication,function(fixture){
        request(fixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(fixture.newAccountObject)
          .expect(200)
          .end(function(err) {
            if (err) {
              return done(err);
            }

            assert(fixture.sideEffect === fixture.sideEffectData);
            done();
          });
      });
    });

    it('shoud call the postRegistrationHandler, even if autoLogin is true',function(done){

      preparePostRegistrationAutoLoginTestFixture(stormpathApplication,function(fixture){
        request(fixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(fixture.newAccountObject)
          .expect('Set-Cookie', /access_token=[^;]+/)
          .expect(200)
          .end(function(err) {
            if (err) {
              return done(err);
            }

            assert(fixture.sideEffect === fixture.sideEffectData);
            done();
          });
      });
    });
  });

  describe('with a Form-Encoded post',function(){

    it('should be given the expanded account object',function(done){

      preparePostRegistrationExpansionTestFixture(stormpathApplication,function(fixture){
        request(fixture.expressApp)
          .post('/register')
          .send(fixture.newAccountObject)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            assert(res.body.customData.favoriteColor === fixture.newAccountObject.favoriteColor);
            done();
          });
      });
    });

    it('should allow me to do work, then call next (let framework end the response)',function(done){

      preparePostRegistrationPassThroughTestFixture(stormpathApplication,function(fixture){
        request(fixture.expressApp)
          .post('/register')
          .send(fixture.newAccountObject)
          .expect(302)
          .end(function(err) {
            if (err) {
              return done(err);
            }

            assert(fixture.sideEffect === fixture.sideEffectData);
            done();
          });
      });
    });

    it('shoud call the postRegistrationHandler, even if autoLogin is true',function(done){

      preparePostRegistrationAutoLoginTestFixture(stormpathApplication,function(fixture){
        request(fixture.expressApp)
          .post('/register')
          .send(fixture.newAccountObject)
          .expect('Set-Cookie', /access_token=[^;]+/)
          .expect(302)
          .end(function(err) {
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