'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

function prepateMeTestFixture(stormpathApplication,cb){

  var app = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    website: true,
    expand: {
      customData: true
    },
    web: {
      me: {
        enabled: true
      }
    }
  });

  var fixture = {
    expressApp: app
  };

  app.on('stormpath.ready', cb.bind(null,fixture));
}

describe('current user (/me) route',function() {

  var newUser = helpers.newUser();
  var stormpathApplication = null;

  newUser.customData = {
    favoriteColor: uuid.v4()
  };

  before(function(done) {
    helpers.createApplication(helpers.createClient(), function(err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      app.createAccount(newUser, done);
    });
  });

  it('should respond with the expanded account object',function(done){
    prepateMeTestFixture(stormpathApplication,function(fixture){
      var agent = request.agent(fixture.expressApp);
      agent
        .post('/login')
        .set('Accept', 'application/json')
        .type('json')
        .send({username: newUser.email, password: newUser.password})
        .end(function(err) {
          if (err) {
            return done(err);
          }

          /**
           * The agent now has the cookies that will allow us to request the
           * /me route
           */

          agent
            .get('/me')
            .expect(200)
            .end(function(err,res){
              if (err) {
                return done(err);
              }
              assert(res.body.customData.favoriteColor === newUser.customData.favoriteColor);
              done();
            });
        });
    });
  });
});