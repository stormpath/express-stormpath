'use strict';

var assert = require('assert');

var helpers = require('../../lib/helpers');

describe('validateAccount', function () {
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
            name: 'passwordConfirm',
            required: true
          }
        }
      }
    }
  };

  it('should return null if no errors are present', function (done) {
    var accountData = {
      givenName: 'Randall',
      surname: 'Degges',
      email: 'randall@stormpath.com',
      password: 'FASRbaBjkrqJSNVlUrV2ZyUy5iUX8UEZ3TW3nejX',
      passwordConfirm: 'FASRbaBjkrqJSNVlUrV2ZyUy5iUX8UEZ3TW3nejX'
    };

    helpers.validateAccount(accountData, config, function (errors) {
      assert.equal(errors, null);
      done();
    });
  });

  it('should return errors if errors are present', function (done) {
    var accountData = {
      givenName: 'Randall',
      surname: 'Degges',
      email: 'randall@stormpath.com',
      password: 'woot',
      passwordConfirm: 'woothi'
    };

    helpers.validateAccount(accountData, config, function (errors) {
      assert.equal(errors.length, 1);
      done();
    });
  });

  it('should return the right number of errors if errors are present', function (done) {
    var accountData = {
      givenName: 'Randall',
      surname: 'Degges'
    };

    helpers.validateAccount(accountData, config, function (errors) {
      assert.equal(errors.length, 3);
      done();
    });
  });
});
