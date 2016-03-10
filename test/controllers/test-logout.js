'use strict';

var sinon = require('sinon');
var assert = require('assert');
var request = require('supertest');
var helpers = require('../helpers');

describe('logout', function () {
  var app;
  var config;
  var sandbox;
  var stormpathApplication;
  var postLogoutHandlerSpy;

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, application) {
      if (err) {
        return done(err);
      }

      sandbox = sinon.sandbox.create();

      postLogoutHandlerSpy = sandbox.spy(function (account, req, res, next) {
        next();
      });

      stormpathApplication = application;

      app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          logout: {
            enabled: true
          }
        },
        postLogoutHandler: postLogoutHandlerSpy
      });

      app.on('stormpath.ready', function (err) {
        if (err) {
          return done(err);
        }

        config = app.get('stormpathConfig');

        done();
      });
    });
  });

  after(function (done) {
    sandbox.restore();
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should not respond to GET request', function (done) {
    request(app)
      .get(config.web.logout.uri)
      .expect(404)
      .end(done);
  });

  it('should bind to /logout by default', function (done) {
    request(app)
      .post(config.web.logout.uri)
      .expect(302)
      .end(done);
  });

  it('should delete the access token and refresh token cookies', function (done) {
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
      request(app)
        .post(config.web.logout.uri)
        .set('Accept', 'text/html')
        .expect(302)
        .end(done);
    });
  });

  describe('when Accept header is set to application/json', function () {
    it('should respond with 200', function (done) {
      request(app)
        .post(config.web.logout.uri)
        .set('Accept', 'application/json')
        .expect(200).end(done);
    });
  });

  it('should follow the next param if present', function (done) {
    request(app)
      .post(config.web.logout.uri + '?next=/goodbye')
      .expect(302)
      .expect('Location', '/goodbye')
      .end(done);
  });
});
