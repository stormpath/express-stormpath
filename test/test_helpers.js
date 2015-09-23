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

describe('validateAccount', function() {
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

  it('should return null if no errors are present', function(done) {
    var accountData = {
      givenName: 'Randall',
      surname: 'Degges',
      email: 'randall@stormpath.com',
      password: 'FASRbaBjkrqJSNVlUrV2ZyUy5iUX8UEZ3TW3nejX',
      passwordConfirm: 'FASRbaBjkrqJSNVlUrV2ZyUy5iUX8UEZ3TW3nejX'
    };

    helpers.validateAccount(accountData, config, function(errors) {
      assert.equal(errors, null);
      done();
    });
  });

  it('should return errors if errors are present', function(done) {
    var accountData = {
      givenName: 'Randall',
      surname: 'Degges',
      email: 'randall@stormpath.com',
      password: 'woot',
      passwordConfirm: 'woothi'
    };

    helpers.validateAccount(accountData, config, function(errors) {
      assert.equal(errors.length, 1);
      done();
    });
  });

  it('should return the right number of errors if errors are present', function(done) {
    var accountData = {
      givenName: 'Randall',
      surname: 'Degges'
    };

    helpers.validateAccount(accountData, config, function(errors) {
      assert.equal(errors.length, 3);
      done();
    });
  });
});

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
        extraData: 'woot',
      }
    );
  });
});

describe('prepAccountData', function() {
  it('should throw an error if formData is not supplied', function() {
    assert.throws(function() {
      helpers.prepAccountData();
    }, Error);
  });

  it('should throw an error if callback is not supplied', function() {
    assert.throws(function() {
      helpers.prepAccountData({});
    }, Error);
  });

  it('should remove extra keys from formData', function(done) {
    helpers.prepAccountData({
      givenName: 'Randall',
      surname: 'Degges',
      email: 'r@rdegges.com',
      password: 'woot!!!!omgHAX',
      extraData: 'hithere'
    }, function(accountData) {
      assert.equal(accountData.extraData, undefined);
      done();
    });
  });

  it('should add extra keys to customData', function(done) {
    helpers.prepAccountData({
      givenName: 'Randall',
      surname: 'Degges',
      email: 'r@rdegges.com',
      password: 'woot!!!!omgHAX',
      extraData: 'hithere'
    }, function(accountData) {
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
