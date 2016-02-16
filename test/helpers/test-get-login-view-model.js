'use strict';

var assert = require('assert');
var getLoginViewModel = require('../../lib/helpers/get-login-view-model');

function getMockConfig() {
  return {
    web: {
      login: {
        fields: {
          'enabled': {
            name: 'enabled',
            enabled: true,
            _enabled: true
          },
          'enabled2': {
            name: 'enabled2',
            enabled: true,
            _enabled: true
          },
          'disabled': {
            name: 'disabled',
            enabled: false,
            _enabled: false
          }
        },
        fieldOrder: [
          'disabled',
          'enabled2',
          'enabled'
        ]
      }
    }
  };
}

function getMockAccountStore() {
  return {
    href: '9d7cbfae-f5f0-4e4d-ac6b-c94b429cc081',
    name: '0fee67c8-cac5-4c44-b2e8-834487aea177',
    provider: {
      href: '321ae5b5-a8e2-49f7-a53f-7dc74822b60f',
      providerId: 'aeb07d2d-5234-4deb-afa5-89cbe480f5a3',
      callbackUri: '4a991672-d690-48c3-84ff-261e7bb88921',
      clientId: '99a534c8-2812-4c6c-b191-549fd88f749b',
      clientSecret: 'cc85f677-98ad-465e-bb49-a97473e5d06d'
    }
  };
}

describe('helpers/get-login-view-model.js', function () {
  var config;

  beforeEach(function () {
    config = getMockConfig();
  });

  describe('getFormFields(config)', function () {
    var getFormFields;
    var returnValue;

    beforeEach(function () {
      getFormFields = getLoginViewModel.getFormFields;
      returnValue = getFormFields(config);
    });

    it('should return a non-empty array', function () {
      assert(Array.isArray(returnValue));
      assert(returnValue.length > 0);
    });

    it('should only return fields with `enabled` set to `true`', function () {
      returnValue.forEach(function (value) {
        // Check `_enabled` as `enabled` has been removed from the result.
        assert(value._enabled === true);
      });
    });

    it('should remove the `enabled` property from returned fields', function () {
      returnValue.forEach(function (value) {
        assert.equal(value.enabled, undefined);
      });
    });

    it('should return the fields in order of `config.web.login.fieldOrder`', function () {
      var fieldOrder = config.web.login.fieldOrder;

      var index = returnValue.map(function (value) {
        return fieldOrder.indexOf(value.name);
      });

      // Copy index array and sort it.
      var sortedIndex = index.slice();
      sortedIndex.sort();

      assert.deepEqual(index, sortedIndex);
    });
  });

  describe('getAccountStoreModel(accountStore)', function () {
    var getAccountStoreModel;
    var accountStore;
    var returnValue;

    beforeEach(function () {
      getAccountStoreModel = getLoginViewModel.getAccountStoreModel;
      accountStore = getMockAccountStore();
      returnValue = getAccountStoreModel(accountStore);
    });

    it('should return an object', function () {
      assert(typeof returnValue === 'object');
    });

    describe('return object', function () {
      it('should not be the accountStore object', function () {
        assert.notEqual(returnValue, accountStore);
      });

      it('should have href of accountStore', function () {
        assert.equal(returnValue.href, accountStore.href);
      });

      it('should have name of accountStore', function () {
        assert.equal(returnValue.name, accountStore.name);
      });

      describe('.provider', function () {
        var provider;

        beforeEach(function () {
          provider = returnValue.provider;
        });

        it('should have href of accountStore.provider', function () {
          assert.equal(provider.href, accountStore.provider.href);
        });

        it('should have callbackUri of accountStore.provider', function () {
          assert.equal(provider.callbackUri, accountStore.provider.callbackUri);
        });

        it('should have clientId of accountStore.provider', function () {
          assert.equal(provider.clientId, accountStore.provider.clientId);
        });

        it('should not have a clientSecret property', function () {
          assert.equal(provider.clientSecret, undefined);
        });
      });
    });
  });
});
