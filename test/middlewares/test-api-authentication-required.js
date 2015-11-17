'use strict';

var async = require('async');
var request = require('supertest');
var uuid = require('uuid');

var apiAuthenticationRequired = require('../../lib/middleware/api-authentication-required');
var DefaultExpressApplicationFixture = require('../fixtures/default-express-application');
var helpers = require('../helpers');

function getPasswordBearerToken(app, account, done) {
  request(app)
    .post('/oauth/token')
    .send('grant_type=password')
    .send('username=' + account.username)
    .send('password=' + account.password)
    .expect(200)
    .end(function (err, res) {
      if (err) {
        return done(err);
      }
      var accessToken = res.body.access_token;
      if (!accessToken) {
        return done(new Error('Could not exchange username password for access token'));
      }
      done(err, accessToken);
    });
}

function getApiKeyBearerToken(app, apiKey, done) {
  request(app)
    .post('/oauth/token')
    .auth(apiKey.id, apiKey.secret)
    .send('grant_type=client_credentials')
    .expect(200)
    .end(function (err, res) {
      if (err) {
        return done(err);
      }
      var accessToken = res.body.access_token;
      if (!accessToken) {
        return done(new Error('Could not exchange credentials for access token'));
      }
      done(err, accessToken);
    });
}

describe('apiAuthenticationRequired', function () {
  var username = uuid.v4() + '@stormpath.com';
  var password = uuid.v4() + uuid.v4().toUpperCase();
  var successResponse = uuid.v4();
  var accountData = {
    username: username,
    email: username,
    password: password,
    givenName: uuid.v4(),
    surname: uuid.v4()
  };
  var stormpathAccount;
  var stormpathApplication;
  var app;
  var accountApiKey;
  var passwordAccessToken;
  var apiKeyAccessToken;

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, application) {
      if (err) {
        return done(err);
      }

      stormpathApplication = application;
      application.createAccount(accountData, function (err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;
        stormpathAccount.createApiKey(function (err, apiKey) {
          if (err) {
            return done(err);
          }

          accountApiKey = apiKey;
          app = new DefaultExpressApplicationFixture(stormpathApplication).expressApp;

          app.get('/protected', apiAuthenticationRequired, function (req, res) {
            res.end(successResponse);
          });

          app.on('stormpath.ready', function () {
            async.parallel({
              passwordAccessToken: getPasswordBearerToken.bind(null, app, accountData),
              apiKeyAccessToken: getApiKeyBearerToken.bind(null, app, apiKey)
            }, function results(err, results) {
              if (err) {
                return done(err);
              }
              passwordAccessToken = results.passwordAccessToken;
              apiKeyAccessToken = results.apiKeyAccessToken;
              done();
            });
          });
        });
      });
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should return 401 if no credentials are supplied', function (done) {

    request(app)
      .get('/protected')
      .expect(401)
      .end(done);

  });

  it('should authenticate the request with access tokens that were obtained by password grant', function (done) {
    request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ' + passwordAccessToken)
      .expect(200, successResponse, done);
  });

  it('should authenticate the request with access tokens that were obtained by client_credentials grant', function (done) {
    request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ' + apiKeyAccessToken)
      .expect(200, successResponse, done);
  });

  it('should authenticate the request with basic auth, with an account api key', function (done) {
    request(app)
      .get('/protected')
      .auth(accountApiKey.id, accountApiKey.secret)
      .expect(200, successResponse, done);
  });


});