'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');
var nJwt = require('njwt');

var DefaultExpressApplicationFixture = require('../fixtures/default-express-application');
var helpers = require('../helpers');

describe('revokeToken (OAuth2 token invalidation endpoint)', function () {
  var application;
  var userAccount;
  var appFixture;
  var accessToken;
  var accessTokenJwt;
  var refreshToken;
  var refreshTokenJwt;
  var username;
  var password;
  var accountData;

  before(function (done) {
    username = uuid.v4() + '@stormpath.com';
    password = uuid.v4() + uuid.v4().toUpperCase();
    accountData = {
      email: username,
      password: password,
      givenName: uuid.v4(),
      surname: uuid.v4()
    };

    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      application = app;
      appFixture = new DefaultExpressApplicationFixture(application);

      app.createAccount(accountData, function (err, acc) {
        userAccount = acc;

        appFixture.expressApp.on('stormpath.ready', done);
      });
    });
  });

  after(function (done) {
    helpers.destroyApplication(application, done);
  });

  beforeEach(function (done) {
    request(appFixture.expressApp)
      .post('/oauth/token')
      .send('grant_type=password')
      .send('username=' + accountData.email)
      .send('password=' + accountData.password)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        var secret = appFixture.expressApp.get('stormpathConfig').client.apiKey.secret;


        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
        accessTokenJwt = nJwt.verify(accessToken, secret);
        refreshTokenJwt = nJwt.verify(refreshToken, secret);
        done();
      });
  });

  it('should require authorization', function (done) {
    request(appFixture.expressApp)
      .post('/oauth/revoke')
      .send('token=sometoken')
      .expect(401)
      .end(done);
  });

  it('should require the token parameter to be sent', function (done) {
    request(appFixture.expressApp)
      .post('/oauth/revoke')
      .set('Authorization', 'Bearer ' + accessToken)
      .expect(400, {error: 'invalid_request'})
      .end(done);
  });

  it('should return 200 even if there is no such token or the token is invalid', function (done) {
    request(appFixture.expressApp)
      .post('/oauth/revoke')
      .send('token=nonexistingtoken')
      .set('Authorization', 'Bearer ' + accessToken)
      .expect(200)
      .end(done);
  });

  it('should invalidate access tokens', function (done) {
    request(appFixture.expressApp)
      .post('/oauth/revoke')
      .send('token=' + accessToken)
      .set('Authorization', 'Bearer ' + accessToken)
      .expect(200)
      .end(function (err) {
        if (err) {
          return done(err);
        }

        userAccount.getAccessTokens(function (err, collection) {
          if (err) {
            return done(err);
          }

          var matchingTokens = collection.items.filter(function (item) {
            return item.href === accessTokenJwt.body.jti;
          });

          assert.equal(matchingTokens.length, 0);
          done();
        });
      });
  });

  it('should invalidate refresh tokens', function (done) {
    request(appFixture.expressApp)
      .post('/oauth/revoke')
      .send('token=' + refreshToken)
      .set('Authorization', 'Bearer ' + accessToken)
      .expect(200)
      .end(function (err) {
        if (err) {
          return done(err);
        }

        userAccount.getRefreshTokens(function (err, collection) {
          if (err) {
            return done(err);
          }

          var matchingTokens = collection.items.filter(function (item) {
            return item.href === refreshTokenJwt.body.jti;
          });

          assert.equal(matchingTokens.length, 0);
          done();
        });
      });
  });

  it('should invalidate the access token when the matching refresh token is invalidated', function (done) {
    request(appFixture.expressApp)
      .post('/oauth/revoke')
      .send('token=' + refreshToken)
      .set('Authorization', 'Bearer ' + accessToken)
      .expect(200)
      .end(function (err) {
        if (err) {
          return done(err);
        }

        userAccount.getAccessTokens(function (err, collection) {
          if (err) {
            return done(err);
          }

          var matchingTokens = collection.items.filter(function (item) {
            return item.href === accessTokenJwt.body.jti;
          });

          assert.equal(matchingTokens.length, 0);
          done();
        });
      });
  });
});