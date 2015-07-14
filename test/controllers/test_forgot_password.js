'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var async = require('async');
var cheerio = require('cheerio');
var express = require('express');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var stormpath = require('../../index');

describe('forgotPassword', function() {
  var stormpathApplication;
  var stormpathClient;

  before(function() {
    stormpathClient = helpers.createClient();
  });

  beforeEach(function(done) {
    helpers.createApplication(stormpathClient, function(err, app) {
      if (err) return done(err);
      stormpathApplication = app;
      done();
    });
  });

  afterEach(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should bind to /forgot if enabled', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      application: {
        href: stormpathApplication.href,
      },
      web: {
        forgotPassword: {
          enabled: true
        }
      }
    }));

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
        assert.equal($('form[action="'+config.web.forgotPassword.uri+'"]').length, 1);
        done();
      });
  });

  it('should return an error if the posted email is not an email', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      application: {
        href: stormpathApplication.href,
      },
      web: {
        forgotPassword: {
          enabled: true
        }
      }
    }));

    app.on('stormpath.ready',function(){
      request(app)
        .post('/forgot')
        .type('form')
        .send({
          email: 'not a real email'
        })
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

  it('should redirect to the next uri if an email is given', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      application: {
        href: stormpathApplication.href,
      },
      web: {
        forgotPassword: {
          enabled: true
        }
      }
    }));

    var config = app.get('stormpathConfig');

    app.on('stormpath.ready',function(){
      request(app)
        .post('/forgot')
        .type('form')
        .send({
          email: uuid.v4() + '@stormpath.com',
        })
        .expect('Location',config.web.forgotPassword.nextUri)
        .expect(302,done);
    });
  });
});
