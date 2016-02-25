'use strict';

var request = require('supertest');

var helpers = require('../helpers');

describe('logout', function () {
  var app;
  var stormpathApplication;

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, a) {
      if (err) {
        return done(err);
      }

      stormpathApplication = a;
      app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          logout: {
            enabled: true
          }
        }
      });

      app.on('stormpath.ready', done);
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should not respond to GET request', function (done) {
    var config = app.get('stormpathConfig');
    request(app)
      .get(config.web.logout.uri)
      .expect(404)
      .end(done);
  });

  it('should bind to /logout by default', function (done) {
    var config = app.get('stormpathConfig');
    request(app)
      .post(config.web.logout.uri)
      .expect(302)
      .end(done);
  });

  it('should delete the access token and refresh token cookies', function (done) {
    var config = app.get('stormpathConfig');
    request(app)
      .post(config.web.logout.uri)
      .expect('Set-Cookie', /access_token=;/)
      .expect('Set-Cookie', /refresh_token=;/)
      .end(done);
  });

  it.skip('should delete the token resources', function () {
    // write a test to assert that the access token and refresh token resources
    // are deleted
  });

  describe('when Accept header is set to text/html', function () {
    it('should respond with 302', function (done) {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.logout.uri)
        .set('Accept', 'text/html')
        .expect(302)
        .end(done);
    });
  });

  describe('when Accept header is set to application/json', function () {
    it('should respond with 200', function (done) {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.logout.uri)
        .set('Accept', 'application/json')
        .expect(200)
        .end(done);
    });
  });

  it('should follow the next param if present', function (done) {
    var config = app.get('stormpathConfig');
    request(app)
      .post(config.web.logout.uri + '?next=/goodbye')
      .expect(302)
      .expect('Location', '/goodbye')
      .end(done);
  });
});
