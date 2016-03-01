'use strict';

var assert = require('assert');

var helpers = require('../../lib/helpers');

describe('prepAccountData', function () {
  var config = {
    web: {
      register: {
        form: {
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
    }
  };

  it('should throw an error if formData is not supplied', function () {
    assert.throws(function () {
      helpers.prepAccountData();
    }, Error);
  });

  it('should throw an error if stormpathConfig is not supplied', function () {
    assert.throws(function () {
      helpers.prepAccountData({});
    }, Error);
  });

  it('should throw an error if callback is not supplied', function () {
    assert.throws(function () {
      helpers.prepAccountData({}, config);
    }, Error);
  });

  it('should remove extra keys from formData', function (done) {
    helpers.prepAccountData({
      givenName: 'Randall',
      surname: 'Degges',
      email: 'r@rdegges.com',
      password: 'woot!!!!omgHAX',
      passwordConfirmWoo: 'woot!!!!omgHAX',
      extraData: 'hithere'
    }, config, function (accountData) {
      assert.equal(accountData.passwordConfirmWoo, undefined);
      assert.equal(accountData.customData.passwordConfirmWoo, undefined);
      assert.equal(accountData.extraData, undefined);
      done();
    });
  });

  it('should add extra keys to customData', function (done) {
    helpers.prepAccountData({
      givenName: 'Randall',
      surname: 'Degges',
      email: 'r@rdegges.com',
      password: 'woot!!!!omgHAX',
      passwordConfirmWoo: 'woot!!!!omgHAX',
      extraData: 'hithere'
    }, config, function (accountData) {
      assert.deepEqual(accountData, {
        givenName: 'Randall',
        surname: 'Degges',
        email: 'r@rdegges.com',
        password: 'woot!!!!omgHAX',
        customData: {
          extraData: 'hithere'
        }
      });
      done();
    });
  });
});
