'use strict';

var assert = require('assert');
var express = require('express');
var helpers = require('./helpers');

describe('#init()', function() {
  it('should export stormpath.init when express-stormpath is required', function() {
    assert.doesNotThrow(function() {
      require('../index').init;
    }, Error);
  });

  it('should should emit a stormpath.ready event when ready', function(done) {

    helpers.createApplication(helpers.createClient(), function(err, application) {
      if (err) {
        return done(err);
      }

      var app = helpers.createStormpathExpressApp({ application: { href: application.href } });
      
      app.on('stormpath.error', done);

      app.on('stormpath.ready', function() {
        helpers.destroyApplication(application, done);
      });
    });
  });

  // Can't figure out how to properly test an async throw...
  it.skip('should throw an error when an invalid configuration is supplied', function (done) {
    var stormpath = require('../index');

    var app = express();

    app.on('stormpath.error', function (err) {
      console.log(err);
      assert.equal(err !== null);
      done();
    });

    app.on('stormpath.ready', done);

    app.use(stormpath.init(app, { application: {}, client: {} }));
  });

  it('should not throw an error if a valid configuration is supplied', function(done) {

    helpers.createApplication(helpers.createClient(), function(err, application) {
      if (err) {
        return done(err);
      }

      var app = helpers.createStormpathExpressApp({ application: { href: application.href } });

      app.on('stormpath.error', done);

      app.on('stormpath.ready', function() {
        helpers.destroyApplication(application, done);
      });
    });
  });
});
