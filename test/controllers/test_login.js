'use strict';

var assert = require('assert');

var async = require('async');
var cheerio = require('cheerio');
var express = require('express');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var stormpath = require('../../index');

describe('login', function() {
  var username = 'robert+'+uuid.v4()+'@stormpath.com';
  var password = uuid.v4() + uuid.v4().toUpperCase();
  var accountData = {
    email:username,
    password:password,
    givenName: uuid.v4(),
    surname: uuid.v4()
  };
  var stormpathApplication;
  var stormpathAccount;
  var stormpathClient;

  before(function(done) {
    stormpathClient = helpers.createClient();

    helpers.createApplication(stormpathClient, function(err, app) {
      if (err) {
        return done(err);
      }
      stormpathApplication = app;
      app.createAccount(accountData,function(err,account){
        if (err) {
          return done(err);
        }
        stormpathAccount = account;
        done();
      });

    });
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should bind to /login if enabled', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    }));

    var config = app.get('stormpathConfig');

    request(app)
      .get('/login')
      .expect(200)
      .end(function(err, res) {
        var $ = cheerio.load(res.text);
        // Assert that the form was rendered.
        assert.equal($('form[action="'+config.web.login.uri+'"]').length, 1);
        done(err);
      });
  });

  it('should return a json error if the accept header supports json and the content type we post is json', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    }));

    app.on('stormpath.ready',function(){
      request(app)
        .post('/login')
        .type('json')
        .set('Accept', 'application/json')
        .expect(400)
        .end(function(err, res) {

          if (err) {
            return done(err);
          }

          var json = JSON.parse(res.text);
          if (!json.error){
            return done(new Error('No JSON error returned.'));
          }
          else if (json.error!=='Invalid username or password.'){
            return done(new Error('Did not receive the expected error'));
          }else{
            done();
          }
        });
    });
  });

  it('should return a successful json response with a status field if the accept header supports json and the content type we post is json and we supply all user data fields', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    }));

    app.on('stormpath.ready',function(){
      request(app)
        .post('/login')
        .type('json')
        .send({
          login: username,
          password: password
        })
        .set('Accept', 'application/json')
        .expect(200)
        .end(done);
    });
  });

  it('should bind to another URL if specified', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true,
          uri: '/newlogin'
        }
      }
    }));

    async.parallel([
      function(cb) {
        request(app)
          .get('/newlogin')
          .expect(200)
          .end(cb);
      },
      function(cb) {
        request(app)
          .get('/login')
          .expect(404)
          .end(cb);
      }
    ], function(err) {
      if (err) {
        return done(err);
      }
      done();
    });
  });

});
