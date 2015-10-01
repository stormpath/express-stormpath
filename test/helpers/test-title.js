'use strict';

var assert = require('assert');

var helpers = require('../../lib/helpers');

describe('title', function() {
  it('should throw an error if str is not supplied', function() {
    assert.throws(function() {
      helpers.title();
    }, Error);
  });

  it('should throw an error if str is not a string', function() {
    assert.throws(function() {
      helpers.title(123);
    }, Error);
  });

  it('should work on one letter strings', function() {
    assert.equal(helpers.title('a'), 'A');
  });

  it('should work on multi-letter strings', function() {
    assert.equal(helpers.title('apple'), 'Apple');
  });
});
