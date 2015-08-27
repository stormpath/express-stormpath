'use strict';

var express = require('express');
var request = require('supertest');
var helpers = require('../helpers');
var stormpath = require('../../index');

describe('logout', function() {
  var stormpathApplication;
  var stormpathClient;

  var app = express();

  before(function(done) {
    stormpathClient = helpers.createClient();

    helpers.createApplication(stormpathClient, function(err, _app) {
      if (err){
        done(err);
      }else{
        stormpathApplication = _app;
        app.use(stormpath.init(app, {
          application: {
            href: stormpathApplication.href
          },
          web: {
            logout: {
              enabled: true
            }
          }
        }));
        app.on('stormpath.ready',done);
      }
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

  it('should delete the access token and refresh token cookies', function(done){
    var config = app.get('stormpathConfig');
    request(app)
      .get(config.web.logout.uri)
      .expect('Set-Cookie',/access_token=;/)
      .expect('Set-Cookie',/refresh_token=;/)
      .end(done);
  });

});
