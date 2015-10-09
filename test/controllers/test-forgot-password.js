'use strict';

var assert = require('assert');
var cheerio = require('cheerio');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

function assertInvalidSpTokenMessage(res){
  var $ = cheerio.load(res.text);
  // Assert that the warning was rendered
  assert.equal($('.invalid-sp-token-warning').length, 1);
}


describe('forgotPassword', function() {
  var stormpathApplication;
  var stormpathClient;

  before(function(done) {
    stormpathClient = helpers.createClient();
    helpers.createApplication(stormpathClient, function(err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      done();
    });
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  afterEach(function(done) {
    helpers.setPasswordResetStatus(stormpathApplication, 'ENABLED', function(err) {
      done(err);
    });
  });

  it('should disable forgot password functionality if the directory has it disabled', function(done) {
    helpers.setPasswordResetStatus(stormpathApplication, 'DISABLED', function(err) {
      if (err) {
        return done(err);
      }

      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        }
      });

      app.on('stormpath.ready', function() {
        var config = app.get('stormpathConfig');
        request(app)
          .get(config.web.forgotPassword.uri)
          .expect(404)
          .end(done);
      });
    });
  });

  it('should bind to /forgot if enabled', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        forgotPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .get('/forgot')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          var $ = cheerio.load(res.text);

          // Assert that the form was rendered.
          assert.equal($('form[action="' + config.web.forgotPassword.uri + '"]').length, 1);
          done();
        });
    });
  });

  it('should return an error if the posted email is not an email', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        forgotPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      request(app)
        .post('/forgot')
        .type('form')
        .send({ email: 'not a real email' })
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          assert(/Please enter a valid email address/.test(res.text));
          done();
        });
    });
  });

  it('should show an info message if the user is redirected here afer an invalid sptoken', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        forgotPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      request(app)
        .get('/forgot?status=invalid_sptoken')
        .expect(200)
        .end(function(err, res) {
          assertInvalidSpTokenMessage(res);
          done();
        });
    });
  });

  it('should redirect to the next uri if an email is given', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        forgotPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post('/forgot')
        .type('form')
        .send({ email: uuid.v4() + '@stormpath.com' })
        .expect('Location', config.web.forgotPassword.nextUri)
        .expect(302, done);
    });
  });

  describe('as json',function(){

    it('should respond with 200 if a valid email is given', function(done){
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          forgotPassword: {
            enabled: true
          }
        }
      });

      app.on('stormpath.ready', function() {
        request(app)
          .post('/forgot')
          .set('Accept', 'application/json')
          .type('json')
          .send({ email: uuid.v4() + '@stormpath.com' })
          .expect(200, done);
      });
    });
  });
});
