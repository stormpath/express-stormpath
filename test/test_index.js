'use strict';

var assert = require('assert');

describe('exports stormpath', function() {
  it('should export the stormpath library when express-stormpath is required', function() {
    assert.doesNotThrow(
      function() {
        var stormpath = require('../index');
      },
      Error
    );
  });

  it('should expose the public library functions', function() {
    var stormpath = require('../index');

    assert(stormpath.init);
    assert(stormpath.loginRequired);
    assert(stormpath.groupsRequired);
    assert(stormpath.apiAuthenticationRequired);
    assert(stormpath.authenticationRequired);
  });
});
