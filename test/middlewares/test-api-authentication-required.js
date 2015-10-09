'use strict';

var request = require('supertest');
var uuid = require('uuid');

var apiAuthenticationRequired = require('../../lib/middleware/api-authentication-required');
var helpers = require('../helpers');

describe('apiAuthenticationRequired', function() {
  var username = uuid.v4() + '@stormpath.com';
  var password = uuid.v4() + uuid.v4().toUpperCase();
  var successResponse = uuid.v4();
  var accountData = {
    email: username,
    password: password,
    givenName: uuid.v4(),
    surname: uuid.v4()
  };
  var stormpathAccount;
  var stormpathApplication;

  before(function(done) {
    helpers.createApplication(helpers.createClient(), function(err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      app.createAccount(accountData, function(err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;
        stormpathAccount.createApiKey(function(err) {
          if (err) {
            return done(err);
          }

          done();
        });
      });
    });
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should return 401 if no credentials are supplied', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      api: true
    });

    app.get('/protected',apiAuthenticationRequired,function(req,res){
      res.end(successResponse);
    });

    app.on('stormpath.ready', function() {
      request(app)
        .get('/protected')
        .expect(401)
        .end(done);
    });
  });

  it('should return the response if valid credentials are supplied', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      api: true
    });

    app.get('/protected',apiAuthenticationRequired,function(req,res){
      res.end(successResponse);
    });

    app.on('stormpath.ready', function() {

      var input = {
        username: accountData.email,
        password: accountData.password
      };

      stormpathApplication.authenticateAccount(input,function(err,authResult){

        var access_token = authResult.getAccessToken();

        if(err){
          return done (err);
        }

        request(app)
          .get('/protected')
          .set('Authorization','Bearer ' + access_token )
          .expect(200,successResponse,done);
      });


    });
  });

});
