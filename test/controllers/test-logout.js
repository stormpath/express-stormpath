'use strict';

var request = require('supertest');

var helpers = require('../helpers');

describe('logout', function() {
  var app;
  var stormpathApplication;

  before(function(done) {
    helpers.createApplication(helpers.createClient(), function(err, a) {
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

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should bind to /logout by default', function(done) {
    var config = app.get('stormpathConfig');
    request(app)
      .get(config.web.logout.uri)
      .expect(302)
      .end(done);
  });

  it('should delete the access token and refresh token cookies', function(done) {
    var config = app.get('stormpathConfig');
    request(app)
      .get(config.web.logout.uri)
      .expect('Set-Cookie', /access_token=;/)
      .expect('Set-Cookie', /refresh_token=;/)
      .end(done);
  });
});
