'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

describe('getToken (OAuth2 support)', function () {
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

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
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
          done();
        });
      });
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should return 405 if <config.web.oauth2.uri> is enabled and a non-POST request is made', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .get('/oauth/token')
        .expect(405)
        .end(done);
    });
  });

  it('should bind to POST <config.web.oauth2.uri> if enabled', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/oauth/token')
        .expect(400, {error:'invalid_request'})
        .end(done);
    });
  });

  it('should not bind to POST <config.web.oauth2.uri> if disabled', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: false
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/oauth/token')
        .expect(404)
        .end(done);
    });
  });

  it('should return a 401 if invalid API credentials are specified', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/oauth/token')
        .auth('woot', 'woot')
        .send('grant_type=client_credentials')
        .expect(401, {error:'Invalid Client Credentials'})
        .end(done);
    });
  });

  it('should return 400 invalid_request if no grant type is specified', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/oauth/token')
        .expect(400, {error:'invalid_request'})
        .end(done);
    });
  });

  it('should return 400 unsupported_grant_type if the grant type is unsupported', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/oauth/token')
        .auth(stormpathAccountApiKey.id, stormpathAccountApiKey.secret)
        .send('grant_type=foo')
        .expect(400, {error:'unsupported_grant_type'})
        .end(done);
    });
  });

  it('should return an access token if grant_type=client_credentials and the credentials are valid', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/oauth/token')
        .auth(stormpathAccountApiKey.id, stormpathAccountApiKey.secret)
        .send('grant_type=client_credentials')
        .expect(200)
        .end(function (err, res) {
          assert(res.body && res.body.access_token);
          assert(res.body && res.body.expires_in && res.body.expires_in === 3600);
          done();
        });
    });
  });
});
