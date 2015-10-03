'use strict';

var assert = require('assert');

var cheerio = require('cheerio');
var express = require('express');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var stormpath = require('../../index');

function requestVerifyPage(app,sptoken){
  var config = app.get('stormpathConfig');
  return request(app)
    .get(config.web.verifyEmail.uri + (sptoken?('?sptoken='+sptoken):''));
}

function assertVerifyFormExists(res) {
  var $ = cheerio.load(res.text);
  // Assert that the form was rendered.
  assert.equal($('input[name="email"]').length, 1);
}

function assertSpTokenWarning(res){
  var $ = cheerio.load(res.text);
  // Assert that the form was rendered.
  assert.equal($('.invalid-sp-token-warning').length, 1);
}

function assertInvalidEmailError(res){
  var $ = cheerio.load(res.text);
  // Assert that the error was shown
  assert($('.alert-danger').html().match(/Please enter a valid email address/));
}

describe('email verification', function() {
  var stormpathApplication;
  var stormpathClient;

  before(function(done) {
    stormpathClient = helpers.createClient();
    helpers.createApplication(stormpathClient, function(err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      helpers.setEmailVerificationStatus(stormpathApplication, 'ENABLED', done);
    });
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should show an "unverified" message after registration', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post('/register')
        .type('form')
        .send(helpers.newUser())
        .expect(302)
        .expect('Location', config.web.login.uri + '?status=unverified')
        .end(done);
    });
  });

  it('should allow me to re-send an email verification message and show the success on the login page', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.verifyEmail.uri)
        .type('form')
        .send({ email: helpers.newUser().email })
        .expect(302)
        .expect('Location', config.web.login.uri + '?status=unverified')
        .end(done);
    });
  });

  it('should show me an error if I submit an invalid email address', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.verifyEmail.uri)
        .type('form')
        .send({ email: uuid() })
        .expect(200)
        .end(function(err, res) {
          assertInvalidEmailError(res);
          done();
        });
    });
  });

  it('should show a form at /verify for re-sending the verification email', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      }
    });

    app.on('stormpath.ready', function() {
      requestVerifyPage(app)
        .expect(200)
        .end(function(err, res) {
          assertVerifyFormExists(res);
          done();
        });
    });
  });

  it('should show a warning message if my sptoken is invalid', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      }
    });

    app.on('stormpath.ready', function() {
      requestVerifyPage(app, 'invalidtoken')
        .expect(200)
        .end(function(err, res) {
          assertSpTokenWarning(res);
          done();
        });
    });
  });

  it('should redirect me to the login page with a verified message if my sptoken is valid', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      }
    });

    app.on('stormpath.ready', function() {
      var application = app.get('stormpathApplication');
      var client = app.get('stormpathClient');
      var config = app.get('stormpathConfig');

      application.createAccount(helpers.newUser(), function(err, account) {
        if (err) {
          return done(err);
        }

        application.resendVerificationEmail({ login: account.email }, function(err) {
          if (err) {
            return done(err);
          }

          client.getAccount(account.href, function(err, account) {
            if (err) {
              return done(err);
            }

            var token = account.emailVerificationToken.href.match(/\/([^\/]+)$/)[1];
            requestVerifyPage(app, token)
              .expect(302)
              .expect('Location', config.web.login.uri + '?status=verified')
              .end(done);
          });
        });
      });
    });
  });

  it('should be able to serve the form at a different uri', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web:{
        verifyEmail:{
          uri: '/' + uuid()
        }
      }
    });

    app.on('stormpath.ready', function() {
      requestVerifyPage(app)
        .expect(200)
        .end(function(err, res) {
          assertVerifyFormExists(res);
          done();
        });
    });
  });

  // it('should show an error if the sptoken is invalid',function(){
  //   var app = express();
  //   app
  //     .use(stormpath.init(app, {
  //       application: {
  //         href: stormpathApplication.href
  //       }
  //     }))
  //     .on('stormpath.ready',function(){
  //       var config = app.get('stormpathConfig');
  //       request(app)
  //         .get(uri)
  //         .expect(200)
  //         .end(function(err,res) {

  //           var $ = cheerio.load(res.text);

  //           // Assert that the form was rendered.
  //           assert.equal($('input[name="email"]').length, 1);
  //           done();
  //         });
  //     });
  // });
});
