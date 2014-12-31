'use strict';

var assert = require('assert');

var express = require('express');

var settings = require('../lib/settings');

describe('init', function() {
  it('should not require any options', function() {
    var app = express();

    assert.doesNotThrow(
      function() {
        settings.init(app);
      },
      Error
    );
  });
});

describe('validate', function() {
});
