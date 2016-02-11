'use strict';

var _ = require('lodash');
var async = require('async');

/**
 * Returns list of all enabled fields, as defined by `stormpath.web.login.fields`,
 * and ordered by `stormpath.web.login.fieldOrder`.
 *
 * @method
 *
 * @param {Object} config - The Stormpath configuration.
 */
function getFormFields(config) {
  // Get fields by fieldOrder.
  var fields = config.web.login.fieldOrder.map(function (fieldName) {
    return config.web.login.fields[fieldName];
  });

  // Filter out only the enabled fields.
  fields = fields.filter(function (field) {
    return field && field.enabled;
  });

  // Remove the `enabled` property.
  fields = fields.map(function (field) {
    var copy = _.clone(field);

    delete copy.enabled;

    return copy;
  });

  return fields;
}

/**
 * Returns a list of account stores for the specified application.
 *
 * @method
 *
 * @param {Object} application - The Stormpath Application to get account stores from.
 * @param {Function} callback - Callback function (error, providers).
 */
function getAccountStores(application, callback) {
  var options = { expand: 'accountStore' };

  // Get account store mappings.
  application.getAccountStoreMappings(options, function (err, accountStoreMappings) {
    if (err) {
      return callback(err);
    }

    // Get account stores.
    async.map(accountStoreMappings.items, function (accountStoreMapping, done) {
      accountStoreMapping.getAccountStore({ expand: 'provider' }, done);
    }, callback);
  });
}

/**
 * Takes an account store object and returns a
 * new object with only the fields that we want
 * to expose to the public.
 *
 * @method
 *
 * @param {Object} accountStore - The account store.
 */
function getAccountStoreModel(accountStore) {
  var provider = accountStore.provider;

  return {
    href: accountStore.href,
    name: accountStore.name,
    provider: {
      href: provider.href,
      providerId: provider.providerId,
      callbackUri: provider.callbackUri,
      clientId: provider.clientId
    }
  };
}

/**
 * Returns a list of all available providers
 * (such as Facebook and SAML Directories).
 *
 * @method
 *
 * @param {Object} config - The Stormpath configuration.
 * @param {Function} callback - Callback function (error, providers).
 */
function getProviders(config, callback) {
  var application = config.application;

  getAccountStores(application, function (err, accountStores) {
    if (err) {
      return callback(err);
    }

    // Filter out only enabled non-stormpath account store providers.
    accountStores = accountStores.filter(function (accountStore) {
      var isStormpathProvider = accountStore.provider.providerId === 'stormpath';
      var isEnabled = accountStore.status === 'ENABLED';

      return isEnabled && !isStormpathProvider;
    });

    // Map account stores to only expose certain fields.
    var providers = accountStores.map(function (accountStore) {
      return getAccountStoreModel(accountStore);
    });

    callback(null, providers);
  });
}

/**
 * Returns an object containing:
 *
 * - A list of all enabled fields, as defined by `stormpath.web.login.fields`,
 *   and ordered by `stormpath.web.login.fieldOrder`.
 * - A list of providers, such as social providers or SAML providers.
 *
 * <https://github.com/stormpath/stormpath-framework-spec/blob/master/login.md#login-view-model>
 *
 * @method
 *
 * @param {Object} config - The Stormpath configuration.
 * @param {Function} callback - Callback function (error, model).
 */
function getLoginViewModel(config, callback) {
  var fields = getFormFields(config);

  var model = {
    form: {
      fields: fields
    },
    accountStores: null
  };

  getProviders(config, function (err, providers) {
    if (err) {
      return callback(err);
    }

    model.accountStores = providers;

    callback(null, model);
  });
}

module.exports = getLoginViewModel;

// Expose private functions for testing.
getLoginViewModel.prototype.getFormFields = getFormFields;
getLoginViewModel.prototype.getAccountStores = getAccountStores;
getLoginViewModel.prototype.getAccountStoreModel = getAccountStoreModel;
getLoginViewModel.prototype.getProviders = getProviders;
