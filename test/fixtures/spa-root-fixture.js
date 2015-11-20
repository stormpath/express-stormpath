'use strict';

var assert = require('assert');
var cheerio = require('cheerio');
var fs = require('fs');
var helpers = require('../helpers');
var uuid = require('uuid');

function SpaRootFixture(stormpathConfig) {
  this.filename = '/tmp/' + uuid.v4();

  if (!stormpathConfig.web) {
    stormpathConfig.web = {};
  }

  stormpathConfig.web.spaRoot = this.filename;

  this.expressApp = helpers.createStormpathExpressApp(stormpathConfig);
}

SpaRootFixture.prototype.before = function before(done) {
  var htmlContent =
    '<html><head><script></script></head><body><p>' +
    this.filename +
    '</p></body></html>';

  fs.writeFile(this.filename, htmlContent, done);
};

SpaRootFixture.prototype.after = function after(done) {
  fs.unlink(this.filename, done);
};

SpaRootFixture.prototype.assertResponse = function assertResponse(done) {
  var spaRootFixture = this;
  return function (err, res) {
    if (err) {
      return done(err);
    }

    var $ = cheerio.load(res.text);

    assert($('html').html());
    assert($('head').html());
    assert.equal($('body p').html(), spaRootFixture.filename);
    done();
  };
};

module.exports = SpaRootFixture;