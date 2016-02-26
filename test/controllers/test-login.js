'use strict';

var assert = require('assert');

var async = require('async');
var cheerio = require('cheerio');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var SpaRootFixture = require('../fixtures/spa-root-fixture');
var stormpath = require('../../index');

describe('login', function () {
  var username = 'test+' + uuid.v4() + '@stormpath.com';
  var password = uuid.v4() + uuid.v4().toUpperCase();
  var accountData = {
    email: username,
    password: password,
    givenName: uuid.v4(),
    surname: uuid.v4()
  };

  var stormpathApplication;

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      app.createAccount(accountData, done);
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should bind to /login if enabled', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      var config = app.get('stormpathConfig');
      request(app)
        .get('/login')
        .expect(200)
        .end(function (err, res) {
          var $ = cheerio.load(res.text);

          // Assert that the form was rendered.
          assert.equal($('form[action="' + config.web.login.uri + '"]').length, 1);
          done(err);
        });
    });
  });

  it('should return a json error if the accept header supports json and the content type we post is json', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/login')
        .type('json')
        .set('Accept', 'application/json')
        .expect(400)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          var json = JSON.parse(res.text);

          if (typeof json !== 'object') {
            done(new Error('No JSON error returned.'));
          } if (json.status !== 200 && json.message !== 'Invalid username or password.') {
            done(new Error('Did not receive the expected error'));
          } else {
            done();
          }
        });
    });
  });

  it('should return a successful json response with a status field if the accept header supports json and the content type we post is json and we supply all user data fields', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/login')
        .type('json')
        .send({ username: username, password: password })
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          // The account data should be returned on the account object
          assert.equal(res.body.account.email, accountData.email);
          // But linked resources should not be returned
          assert.equal(res.body.account.customDta, undefined);
          done();
        });
    });
  });

  it('should retain the requested url when redirecting to the login page', function (done) {
    var protectedUri = '/' + uuid.v4();
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.get(protectedUri, stormpath.loginRequired);
    app.on('stormpath.ready', function () {
      request(app)
        .get(protectedUri)
        .expect(302)
        .expect('Location', '/login?next=' + encodeURIComponent(protectedUri))
        .end(done);
    });
  });

  it('should retain the requested url in the form action url', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      var config = app.get('stormpathConfig');
      var nextUri = uuid.v4();
      request(app)
        .get('/login?next=' + encodeURIComponent(nextUri))
        .expect(200)
        .end(function (err, res) {
          var $ = cheerio.load(res.text);

          // Assert that the form was rendered.
          assert.equal($('form[action="' + config.web.login.uri + '?next=' + nextUri + '"]').length, 1);
          done(err);
        });
    });
  });

  it('should not allow an open redirect', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      var nextUri = 'http://stormpath.com/foo';
      request(app)
        .post('/login?next=' + encodeURIComponent(nextUri))
        .send({ login: username, password: password })
        .expect(302)
        .expect('Location', '/foo')
        .end(done);
    });
  });

  it('should redirect me to the next url if given', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      var nextUri = uuid.v4();
      request(app)
        .post('/login?next=' + encodeURIComponent(nextUri))
        .send({ login: username, password: password })
        .expect(302)
        .expect('Location', nextUri)
        .end(done);
    });
  });

  it('should bind to another URL if specified', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true,
          uri: '/newlogin'
        }
      }
    });

    app.on('stormpath.ready', function () {
      async.parallel([
        function (cb) {
          request(app)
            .get('/newlogin')
            .expect(200)
            .end(cb);
        },
        function (cb) {
          request(app)
            .get('/login')
            .expect(404)
            .end(cb);
        }
      ], done);
    });
  });

  describe('if configured with a SPA root', function () {

    var spaRootFixture;

    before(function (done) {
      spaRootFixture = new SpaRootFixture({
        application: {
          href: stormpathApplication.href
        },
        web: {
          login: {
            enabled: true
          }
        }
      });
      spaRootFixture.before(done);
    });

    after(function (done) {
      spaRootFixture.after(done);
    });


    it('should return the SPA root', function (done) {

      var app = spaRootFixture.expressApp;

      app.on('stormpath.ready', function () {
        var config = app.get('stormpathConfig');
        request(app)
          .get(config.web.login.uri)
          .set('Accept', 'text/html')
          .expect(200)
          .end(spaRootFixture.assertResponse(done));
      });

    });
  });
});
