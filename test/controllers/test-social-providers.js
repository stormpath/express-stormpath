'use strict';

var assert = require('assert');
var express = require('express');
var request = require('supertest');
var uuid = require('uuid');
var async = require('async');

var helpers = require('../helpers');
var stormpath = require('../../index');

describe('/spa-config/social-providers', function() {
  var app;
  var stormpathClient;
  var stormpathApplication;
  var response;

  function createStormpathApplication(done) {
    helpers.createApplication(stormpathClient, function(err, app) {
      stormpathApplication = app;
      done(err, app);
    });
  }

  function createStormpathExpressApp(done) {
    app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      website: true
    });

    done(null, app);
  }

  function waitForReady(done) {
    app.on('stormpath.ready', done);
  }

  function performRequest(done) {
    request(app)
      .get('/spa-config/social-providers')
      .end(function(err, result) {
        if (err) {
          return done(err);
        }

        response = JSON.parse(result.text);
        done(null, response);
      });
  }

  before(function(done) {
    stormpathClient = helpers.createClient();

    async.series([
      createStormpathApplication,
      createStormpathExpressApp,
      waitForReady
    ], done);
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  describe('when no social directories exist', function() {
    before(performRequest);

    it('should return an object', function() {
      assert.equal(typeof response === 'object', true);
    });

    it('should have "facebook.enabled" set to false', function() {
      assert.equal(response.hasOwnProperty('facebook'), true);
      assert.equal(response.facebook.enabled, false);
    });

    it('should have "google.enabled" set to false', function() {
      assert.equal(response.hasOwnProperty('google'), true);
      assert.equal(response.google.enabled, false);
    });

    it('should have "linkedin.enabled" set to false', function() {
      assert.equal(response.hasOwnProperty('linkedin'), true);
      assert.equal(response.linkedin.enabled, false);
    });
  });

  describe('when a Facebook directory exists', function() {
    var facebookDirectory;
    var facebookClientId;
    var facebookClientSecret;

    function createFacebookDirectory(done) {
      stormpathClient.createDirectory({
        name: 'facebook_' + uuid(),
        provider: {
          providerId: 'facebook',
          clientId: facebookClientId,
          clientSecret: facebookClientSecret
        }
      }, function(err, directory) {
        facebookDirectory = directory;

        stormpathApplication.createAccountStoreMapping({
          accountStore: {
            href: directory.href
          }
        }, function(err, mapping) {
          done(err, directory);
        });
      });
    }

    before(function(done) {
      facebookClientId = uuid();
      facebookClientSecret = uuid();

      async.series([
        createFacebookDirectory,
        createStormpathExpressApp,
        waitForReady,
        performRequest
      ], done);
    });

    it('should have "facebook.enabled" set to true', function() {
      assert.equal(response.hasOwnProperty('facebook'), true);
      assert.equal(response.facebook.enabled, true);
    });

    it('should have "google.enabled" set to false', function() {
      assert.equal(response.hasOwnProperty('google'), true);
      assert.equal(response.google.enabled, false);
    });

    it('should have "linkedin.enabled" set to false', function() {
      assert.equal(response.hasOwnProperty('linkedin'), true);
      assert.equal(response.linkedin.enabled, false);
    });

    it('should expose the Facebook Client Id', function() {
      assert.equal(response.facebook.clientId, facebookClientId);
    });

    it('should not expose the Facebook Client Secret', function() {
      assert.equal(response.facebook.hasOwnProperty('clientSecret'), false);
    });
  });
});
