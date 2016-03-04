'use strict';

var assert = require('assert');

var helpers = require('../../lib/helpers');

describe('sanitizeFormData', function () {
  it('should throw an error if formData is not supplied', function () {
    assert.throws(function () {
      helpers.sanitizeFormData();
    }, Error);
  });

  it('should remove any sensitive data from formData', function () {
    assert.deepEqual(
      helpers.sanitizeFormData({
        givenName: 'Randall',
        surname: 'Degges',
        extraData: 'woot',
        password: 'omghax',
        passwordConfirmWoo: 'omghaxx'
      }),
      {
        givenName: 'Randall',
        surname: 'Degges',
        extraData: 'woot'
      }
    );
  });
});
