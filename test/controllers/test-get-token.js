'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');
var nJwt = require('njwt');

var DefaultExpressApplicationFixture = require('../fixtures/default-express-application');
var helpers = require('../helpers');
var Oauth2DisabledFixture = require('../fixtures/oauth2-disabled');
var ScopeFactoryFixture = require('../fixtures/scope-factory');

describe('getToken (OAuth2 token exchange endpoint)', function () {
  var username = uuid.v4() + '@stormpath.com';
  var password = uuid.v4() + uuid.v4().toUpperCase();
  var accountData = {
    email: username,
    password: password,
    givenName: uuid.v4(),
    surname: uuid.v4()
  };
  var stormpathAccount;
  var stormpathAccountApiKey;
  var stormpathApplication;
  var enabledFixture;
  var disabledFixture;
  var scopeFactoryFixture;
  var refreshToken;
  var scopeFactory;
  var requestScope;
  var createScope;

  before(function (done) {

    /**
     * Epic hack to observe all ready events and know when they are both done
     */
    var readyCount = 0;
    function ready() {
      readyCount++;
      if (readyCount === 3) {
        setTimeout(done, 1500); // HACK see what's up with this!
      }
    }

    requestScope = 'admin';

    createScope = function (scope) {
      return scope + '-' + username;
    };

    scopeFactory = function (authenticationResult, requestedScope, callback) {
      assert.equal(requestScope, requestedScope);
      callback(null, createScope(requestedScope));
    };

    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;

      enabledFixture = new DefaultExpressApplicationFixture(stormpathApplication);
      disabledFixture = new Oauth2DisabledFixture(stormpathApplication);
      scopeFactoryFixture = new ScopeFactoryFixture(stormpathApplication, scopeFactory);

      app.createAccount(accountData, function (err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;
        stormpathAccount.createApiKey(function (err, key) {
          if (err) {
            return done(err);
          }

          stormpathAccountApiKey = key;

          enabledFixture.expressApp.on('stormpath.ready', ready);
          disabledFixture.expressApp.on('stormpath.ready', ready);
          scopeFactoryFixture.expressApp.on('stormpath.ready', ready);
        });
      });
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should return 405 if <config.web.oauth2.uri> is enabled and a non-POST request is made', function (done) {

    request(enabledFixture.expressApp)
      .get('/oauth/token')
      .expect(405)
      .end(done);

  });

  it('should bind to POST <config.web.oauth2.uri> if enabled', function (done) {

    request(enabledFixture.expressApp)
      .post('/oauth/token')
      .expect(400, {error:'invalid_request'})
      .end(done);

  });

  it('should not bind to POST <config.web.oauth2.uri> if disabled', function (done) {

    request(disabledFixture.expressApp)
      .post('/oauth/token')
      .expect(404)
      .end(done);

  });

  it('should return 401 invalid_client if grant_type=client_credentials and the credentials are invalid', function (done) {

    request(enabledFixture.expressApp)
      .post('/oauth/token')
      .send('client_id=woot')
      .send('client_secret=woot')
      .send('grant_type=client_credentials')
      .auth('woot', 'woot')
      .expect(401)
      .end(function (err, res) {
        assert.equal(res.body && res.body.message, 'API Key Authentication failed.');
        assert.equal(res.body && res.body.error, 'invalid_client');
        done();
      });

  });

  it('should return 400 invalid_grant if grant_type=password and the username & password are invalid', function (done) {

    request(enabledFixture.expressApp)
      .post('/oauth/token')
      .send('grant_type=password')
      .send('username=nobody@stormpath.com')
      .send('password=foo')
      .expect(400)
      .end(function (err, res) {
        assert.equal(res.body && res.body.message, 'Invalid username or password.');
        assert.equal(res.body && res.body.error, 'invalid_grant');
        done();
      });

  });

  it('should return 400 invalid_request if no grant_type is specified', function (done) {

    request(enabledFixture.expressApp)
      .post('/oauth/token')
      .expect(400, {error:'invalid_request'})
      .end(done);

  });

  it('should return 400 unsupported_grant_type if the grant type is unsupported', function (done) {

    request(enabledFixture.expressApp)
      .post('/oauth/token')
      .auth(stormpathAccountApiKey.id, stormpathAccountApiKey.secret)
      .send('grant_type=foo')
      .expect(400, {error:'unsupported_grant_type'})
      .end(done);

  });

  describe('with Auth header', function () {
    it('should return an access token if grant_type=client_credentials and the credentials are valid', function (done) {
      request(enabledFixture.expressApp)
        .post('/oauth/token')
        .auth(stormpathAccountApiKey.id, stormpathAccountApiKey.secret)
        .send('grant_type=client_credentials')
        .expect(200)
        .end(function (err, res) {
          assert(res.body && res.body.access_token);
          assert.equal(res.body && res.body.expires_in && res.body.expires_in, 3600);
          done();
        });
    });
  });

  describe('with data fields', function () {
    it('should return an access token if grant_type=client_credentials and the credentials are valid', function (done) {
      request(enabledFixture.expressApp)
        .post('/oauth/token')
        .send('client_id=' + stormpathAccountApiKey.id)
        .send('client_secret=' + stormpathAccountApiKey.secret)
        .send('grant_type=client_credentials')
        .expect(200)
        .end(function (err, res) {
          assert(res.body && res.body.access_token);
          assert.equal(res.body && res.body.expires_in && res.body.expires_in, 3600);
          done();
        });
    });
  });

  it('should return an access token & refresh token if grant_type=password and the username & password are valid', function (done) {

    request(enabledFixture.expressApp)
      .post('/oauth/token')
      .send('grant_type=password')
      .send('username=' + accountData.email)
      .send('password=' + accountData.password)
      .expect(200)
      .end(function (err, res) {
        assert(res.body && res.body.access_token);
        assert.equal(res.body && res.body.expires_in && res.body.expires_in, 3600);
        assert(res.body && res.body.refresh_token);
        refreshToken = res.body.refresh_token;
        done();
      });

  });

  it('should return an access token if grant_type=refresh_token and the refresh_token is valid', function (done) {

    request(enabledFixture.expressApp)
      .post('/oauth/token')
      .send('grant_type=refresh_token')
      .send('refresh_token=' + refreshToken)
      .expect(200)
      .end(function (err, res) {
        assert(res.body && res.body.access_token);
        assert.equal(res.body && res.body.expires_in && res.body.expires_in, 3600);
        done();
      });

  });

  it('should return 400 invalid_grant if the refresh_token is invalid', function (done) {

    request(enabledFixture.expressApp)
      .post('/oauth/token')
      .send('grant_type=refresh_token')
      .send('refresh_token=foo' + refreshToken)
      .expect(400)
      .end(function (err, res) {
        assert.equal(res.body && res.body.error, 'invalid_grant');
        done();
      });

  });

  describe('scope factories', function () {
    var secret;

    before(function () {
      var config = scopeFactoryFixture.expressApp.get('stormpathConfig');
      secret = config.client.apiKey.secret;
    });

    it('should utilize the scope factory if defined for password grant type', function (done) {
      request(scopeFactoryFixture.expressApp)
        .post('/oauth/token')
        .send('grant_type=password')
        .send('username=' + accountData.email)
        .send('password=' + accountData.password)
        .send('scope=' + requestScope)
        .expect(200)
        .end(function (err, res) {
          assert(res.body && res.body.access_token);
          nJwt.verify(res.body.access_token, secret, function (err, token) {
            if (err) {
              return done(err);
            }

            assert.equal(token.body.scope, createScope(requestScope));
            done();
          });
        });
    });

    it('should utilize the scope factory if defined for client_credentials grant type', function (done) {
      request(scopeFactoryFixture.expressApp)
        .post('/oauth/token')
        .send('client_id=' + stormpathAccountApiKey.id)
        .send('client_secret=' + stormpathAccountApiKey.secret)
        .send('grant_type=client_credentials')
        .send('scope=' + requestScope)
        .expect(200)
        .end(function (err, res) {
          assert(res.body && res.body.access_token);
          nJwt.verify(res.body.access_token, secret, function (err, token) {
            if (err) {
              return done(err);
            }

            assert.equal(token.body.scope, createScope(requestScope));
            done();
          });
        });
    });
  });
});
