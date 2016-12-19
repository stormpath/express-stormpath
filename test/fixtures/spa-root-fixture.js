'use strict';

var assert = require('assert');
var cheerio = require('cheerio');
var fs = require('fs');
var helpers = require('../helpers');
var uuid = require('uuid');

/**
 * This SPA Root Fixture takes in your desired Stormpath Config, and then
 * attaches the spaRoot option to the web config.  It creates a SPA root file
 * in the before hook, and cleans it up in the after hook.
 *
 * It also provides an assertResponse() function which you can pass to the
 * end() method of a supertest agent.  It will assert that the SPA root was
 * served.
 *
 * @param {object} stormpathConfig The config for stormpath.init()
 */
function SpaRootFixture(stormpathConfig) {
  this.filename = '/tmp/' + uuid.v4();

  if (!stormpathConfig.web) {
    stormpathConfig.web = {
      produces: ['text/html', 'application/json']
    };
  }

  stormpathConfig.web.spa = {
    enabled: true,
    view: this.filename
  };

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