'use strict';

var helpers = require('./helpers');

var ProducesFixture = require('./fixtures/produces-fixture');

describe('produces option', function () {

  var stormpathApplication;

  before(function (done) {
    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      done();
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  describe('if configured as [\'application/json\',\'text/html\']', function () {
    var fixture;

    before(function (done) {
      fixture = new ProducesFixture(stormpathApplication, ['application/json', 'text/html'], done);
    });

    describe('and request is Accept: text/html', function () {
      it('should respond with HTML', function (done) {
        fixture.requestAsHtml().end(fixture.assertHtmlResponse(done));
      });
    });
    describe('and request is Accept: application/json', function () {
      it('should respond with JSON', function (done) {
        fixture.requestAsJson().end(fixture.assertJsonResponse(done));
      });
    });
  });

  describe('if configured as [\'application/json\']', function () {
    var fixture;

    before(function (done) {
      fixture = new ProducesFixture(stormpathApplication, ['application/json'], done);
    });

    describe('and request is Accept: text/html', function () {
      it('should respond with 404', function (done) {
        fixture.requestAsHtml().end(fixture.assert404Response(done));
      });
    });

    describe('and request is Accept: application/json', function () {
      it('should respond with JSON', function (done) {
        fixture.requestAsJson().end(fixture.assertJsonResponse(done));
      });
    });
  });

  describe('if configured as [\'text/html\']', function () {
    var fixture;

    before(function (done) {
      fixture = new ProducesFixture(stormpathApplication, ['text/html'], done);
    });

    describe('and request is Accept: text/html', function () {
      it('should respond with HTML', function (done) {
        fixture.requestAsHtml().end(fixture.assertHtmlResponse(done));
      });
    });
    describe('and request is Accept: application/json', function () {
      it('should respond with 404', function (done) {
        fixture.requestAsJson().end(fixture.assert404Response(done));
      });
    });
  });

});
