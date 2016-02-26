'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');
var async = require('async');

var helpers = require('../helpers');

describe('/spa-config', function () {
  var app;
  var stormpathClient;
  var stormpathApplication;
  var response;

  function createStormpathApplication(done) {
    helpers.createApplication(stormpathClient, function (err, app) {
      stormpathApplication = app;
      done(err, app);
    });
  }

  function createStormpathExpressApp(done) {
    app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      }
    });

    done(null, app);
  }

  function waitForReady(done) {
    app.on('stormpath.ready', done);
  }

  function performRequest(done) {
    request(app)
      .get('/spa-config')
      .end(function (err, result) {
        if (err) {
          return done(err);
        }

        response = JSON.parse(result.text);
        done(null, response);
      });
  }

  before(function (done) {
    stormpathClient = helpers.createClient();

    async.series([
      createStormpathApplication,
      createStormpathExpressApp,
      waitForReady,
      performRequest
    ], done);
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should return an object', function () {
    assert.equal(typeof response === 'object', true);
  });

  describe('socialProviders property', function () {
    var socialProviders;

    before(function () {
      socialProviders = response.socialProviders;
    });

    it('should be an object', function () {
      assert.equal(typeof socialProviders === 'object', true);
    });

    describe('when no Facebook directories exist', function () {
      it('should have no "facebook" property', function () {
        assert.equal(socialProviders.hasOwnProperty('facebook'), false);
      });
    });

    describe('when a Facebook directory exists', function () {
      var facebookClientId;
      var facebookClientSecret;
      var socialProviders;

      function createFacebookDirectory(done) {
        stormpathClient.createDirectory({
          name: 'facebook_' + uuid(),
          provider: {
            providerId: 'facebook',
            clientId: facebookClientId,
            clientSecret: facebookClientSecret
          }
        }, function (err, directory) {

          stormpathApplication.createAccountStoreMapping({
            accountStore: {
              href: directory.href
            }
          }, function (err) {
            done(err, directory);
          });
        });
      }

      before(function (done) {
        facebookClientId = uuid();
        facebookClientSecret = uuid();

        async.series([
          createFacebookDirectory,
          createStormpathExpressApp,
          waitForReady,
          performRequest
        ], function (err) {
          socialProviders = response.socialProviders;
          done(err);
        });
      });

      it('should have a "facebook" property', function () {
        assert.equal(socialProviders.hasOwnProperty('facebook'), true);
      });

      it('should have "facebook.enabled" set to true', function () {
        assert.equal(socialProviders.facebook.enabled, true);
      });

      it('should expose the Facebook Client Id', function () {
        assert.equal(socialProviders.facebook.clientId, facebookClientId);
      });

      it('should not expose the Facebook Client Secret', function () {
        assert.equal(socialProviders.facebook.hasOwnProperty('clientSecret'), false);
      });
    });
  });
});
