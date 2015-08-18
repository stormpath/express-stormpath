'use strict';

var assert = require('assert');
var helpers = require('../lib/helpers');

describe('getRequiredRegistrationFields', function() {
  it('should return an empty array if the config properties are not present', function(done) {
    helpers.getRequiredRegistrationFields({}, function(fields) {
      assert.equal(fields.length, 0);
      done();
    });
  });

  it('should return an empty array if no fields are required', function(done) {
    var config = {
      web: {
        register: {
          fields: {}
        }
      }
    };

    helpers.getRequiredRegistrationFields(config, function(fields) {
      assert.equal(fields.length, 0);
      done();
    });
  });

  it('should return required fields only if fields are required', function(done) {
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
              required: false
            }
          }
        }
      }
    };

    helpers.getRequiredRegistrationFields(config, function(fields) {
      assert.equal(fields.length, 2);
      done();
    });
  });
});
