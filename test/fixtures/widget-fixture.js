'use strict';

var assert = require('assert');
var cheerio = require('cheerio');

function WidgetFixture(method) {
  this.method = method;
}

WidgetFixture.prototype.assertResponse = function assertResponse(response) {
  var $ = cheerio.load(response.text);

  assert($('html').length > 0);
  assert($('head').length > 0);
  assert($('#widget-view').length > 0);

  assert(response.text.indexOf('stormpath.' + this.method + '(') > -1);
};

module.exports = WidgetFixture;