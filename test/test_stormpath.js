'use strict';

var assert = require('assert');

var express = require('express');

var helpers = require('./helpers');

describe('.init', function() {
  it('should export stormpath.init when express-stormpath is required', function() {
    assert.doesNotThrow(
      function() {
        require('../index').init;
      },
      Error
    );
  });

  it('should should emit a stormpath.ready event when ready', function(done) {
    var stormpath = require('../index');

    helpers.createApplication(helpers.createClient(), function(err, application) {
      if (err) {
        return done(err);
      }

      var app = helpers.createStormpathExpressApp({
        application: {
          href: application.href
        }
      });

      app.on('stormpath.ready', function() {
        done();
      });
    });
  });
});
