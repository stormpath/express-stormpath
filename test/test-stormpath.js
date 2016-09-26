'use strict';

var assert = require('assert');
var express = require('express');
var helpers = require('./helpers');
var stormpath = require('../index');

var applicationConfigurationErrorRegExp = new RegExp(/Please specify your Stormpath Application in your configuration/);

describe('stormpath.init()', function () {
  var stormpathApplication;


  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, application) {
      if (err) {
        return done(err);
      }
      stormpathApplication = application;
      done();
    });
  });


  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });


  it('should export stormpath.init when express-stormpath is required', function () {

    assert.doesNotThrow(function () {
      require('../index').init;
    }, Error);

  });


  it('should should emit a stormpath.ready event when ready', function (done) {

    var app = helpers.createStormpathExpressApp({ application: stormpathApplication });

    app.on('stormpath.ready', function () {
      done();
    });

  });


  it('should emit an error if an application is not defined', function (done) {

    /**
     * NOTE: this test requires you to NOT define STORMPATH_APPLICATION_HREF in the environment.
     */

    var app = express();

    app.on('stormpath.error', function (err) {
      assert(err && err.message.match(applicationConfigurationErrorRegExp));
      done();
    });

    app.use(stormpath.init(app, {
      logger: helpers.noOpLogger
    }));

  });


  it('should allow me to define a custom logger', function (done) {

    var app = express();

    app.use(stormpath.init(app, {
      logger: {
        error: function (err) {
          assert(err && err.message.match(applicationConfigurationErrorRegExp));
          done();
        }
      }
    }));

  });

});
