'use strict';

var assert = require('assert');

var helpers = require('../../lib/helpers');

describe('sanitizeFormData', function() {
  var config = {
    web: {
      register: {
        fields: {
          givenName: {
            name: 'givenName',
            required: true
          },
          surname: {
            name: 'surname',
            required: true
          },
          email: {
            name: 'email',
            required: true
          },
          password: {
            name: 'password',
            required: true
          },
          passwordConfirm: {
            name: 'passwordConfirmWoo',
            required: true
          }
        }
      }
    }
  };

  it('should throw an error if formData is not supplied', function() {
    assert.throws(function() {
      helpers.sanitizeFormData();
    }, Error);
  });

  it('should throw an error if stormpathConfig is not supplied', function() {
    assert.throws(function() {
      helpers.sanitizeFormData({});
    }, Error);
  });

  it('should remove any sensitive data from formData', function() {
    assert.deepEqual(
      helpers.sanitizeFormData({
        givenName: 'Randall',
        surname: 'Degges',
        extraData: 'woot',
        password: 'omghax',
        passwordConfirmWoo: 'omghaxx'
      }, config),
      {
        givenName: 'Randall',
        surname: 'Degges',
        extraData: 'woot'
      }
    );
  });
});
