'use strict';

var assert = require('assert');

var async = require('async');
var cheerio = require('cheerio');
var express = require('express');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var stormpath = require('../../index');

describe('getToken', function() {
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

  before(function(done) {
    helpers.createApplication(helpers.createClient(), function(err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      app.createAccount(accountData, function(err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;
        stormpathAccount.createApiKey(function(err, key) {
          if (err) {
            return done(err);
          }

          stormpathAccountApiKey = key;
          done();
        });
      });
    });
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should return a 404 if <config.web.oauth2.uri> is enabled and a non-POST request is made', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true,
          uri: '/oauth/token'
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .get('/oauth/token')
        .expect(404)
        .end(done);
    });
  });

  it('should bind to POST <config.web.oauth2.uri> if enabled', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true,
          uri: '/oauth/token'
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post('/oauth/token')
        .expect(401)
        .end(done);
    });
  });

  it('should not bind to POST <config.web.oauth2.uri> if disabled', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: false,
          uri: '/oauth/token'
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post('/oauth/token')
        .expect(404)
        .end(done);
    });
  });

  it('should return a 401 if invalid API credentials are specified', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true,
          uri: '/oauth/token'
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post('/oauth/token')
        .auth('woot', 'woot')
        .expect(401)
        .end(done);
    });
  });

  it('should return JSON if invalid API credentials are specified', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true,
          uri: '/oauth/token'
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post('/oauth/token')
        .auth('woot', 'woot')
        .expect(401)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          var json = JSON.parse(res.text);
          assert(json.error);

          done();
        });
    });
  });

  //////////////////////////////////////////
  it.skip('should return a 400 if valid API credentials are provided but no grant_type is specified', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true,
          uri: '/oauth/token'
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post('/oauth/token')
        .auth(stormpathAccountApiKey.id, stormpathAccountApiKey.secret)
        .expect(400)
        .end(done);
    });
  });

  it.skip('should return a 400 if valid API credentials are provided but an invalid grant_type is specified', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true,
          uri: '/oauth/token'
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post('/oauth/token?grant_type=test')
        .auth(stormpathAccountApiKey.id, stormpathAccountApiKey.secret)
        .expect(400)
        .end(done);
    });
  });

  it('should return a 200 and an access token response if valid API credentials are provided and grant_type is valid', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        oauth2: {
          enabled: true,
          uri: '/oauth/token'
        }
      }
    });

    app.on('stormpath.ready', function() {
      request(app)
        .post('/oauth/token?grant_type=client_credentials')
        .auth(stormpathAccountApiKey.id, stormpathAccountApiKey.secret)
        .expect(200,function(err,res){
          assert(res.body && res.body.access_token);
          done();
        });
    });
  });
});
