'use strict';

var assert = require('assert');

var request = require('supertest');

var helpers = require('../helpers');

/**
 * Test fixture for testing the web.produces option.  It requres a Stormpath
 * application an a definition of what content types should be produced by the
 * framework instance.
 *
 * At the moment it is hard-coded to to it's tests against the /login endpoint,
 * that can be changed if we want to test all the endpoints that have content
 * type negotion, but at this point I don't feel that is necessary.
 *
 * @param {Object} stormpathApplication A Stormpath Application Instance
 * @param {Array} producesArray         The configuration property for web.produces
 * @param {Function} readyFn            Function that will be called once stormpath.ready has been emitted.
 */
function ProducesFixture(stormpathApplication, producesArray, readyFn) {
  this.expressApp = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    web: {
      produces: producesArray
    }
  });
  this.expressApp.on('stormpath.ready', readyFn);
}
ProducesFixture.prototype.getEndpointWithAccept = function getEndpointWithAccept(acceptString) {
  var stormpathConfig = this.expressApp.get('stormpathConfig');

  return request(this.expressApp)
    .get(stormpathConfig.web.login.uri)
    .set('Accept', acceptString);
};
ProducesFixture.prototype.requestAsBrowser = function requestAsBrowser() {
  return this.getEndpointWithAccept('text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
};
ProducesFixture.prototype.requestAsJson = function requestAsJson() {
  return this.getEndpointWithAccept('application/json');
};
ProducesFixture.prototype.requestAsHtml = function requestAsHtml() {
  return this.getEndpointWithAccept('text/html');
};
ProducesFixture.prototype.requestWithoutAcceptHeader = function requestWithoutAcceptHeader() {
  var stormpathConfig = this.expressApp.get('stormpathConfig');

  return request(this.expressApp)
    .get(stormpathConfig.web.login.uri);
};
ProducesFixture.prototype.assertHtmlResponse = function assertHtmlResponse(done) {
  return function (err, res) {
    if (err) {
      return done(err);
    }
    assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
    done();
  };
};
ProducesFixture.prototype.assertJsonResponse = function assertJsonResponse(done) {
  return function (err, res) {
    if (err) {
      return done(err);
    }
    assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
    done();
  };
};
ProducesFixture.prototype.assert406Response = function assert406Response(done) {
  return function (err, res) {
    if (err) {
      return done(err);
    }
    assert.equal(res.status, 406);
    done();
  };
};

module.exports = ProducesFixture;