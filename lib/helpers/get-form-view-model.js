'use strict';

var async = require('async');
var _ = require('lodash');

var cache = {};

/**
 * Returns the cached model if it's not older than `ttl`.
 * Else it returns null.
 *
 * @method
 *
 * @param {string} formName - The name of the form (e.g. 'login' or 'register').
 * @param {number} ttl - The time-to-live value for the cached object.
 */
function getCachedModel(formName, ttl) {
  var cacheItem = cache[formName];

  if (!cacheItem) {
    return null;
  }

  var age = (new Date().getTime() - cacheItem.timestamp) / 1000; // In seconds.

  if (age <= ttl) {
    return cacheItem.model;
  }

  return null;
}

/**
 * Saves the model in "cache" together with a timestamp.
 *
 * @method
 *
 * @param {string} formName - The name of the form (e.g. 'login' or 'register').
 * @param {Object} model - The model to cache.
 */
function setCachedModel(formName, model) {
  cache[formName] = {
    model: model,
    timestamp: new Date().getTime()
  };
}

/**
 * Returns list of all enabled fields, as defined by `form.fields`,
 * and ordered by `form.fieldOrder`.
 *
 * @method
 *
 * @param {Object} form - The form from the Stormpath configuration.
 */
function getFormFields(form) {
  // Get fields by fieldOrder.
  var fields = form.fieldOrder.map(function (fieldName) {
    var field = _.clone(form.fields[fieldName]);
    field.name = fieldName;
    return field;
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

    // Iterate over all account stores, and filter out the ones that
    // don't have a provider (Organizations dont have providers)

    accountStoreMappings.filter(function (accountStoreMapping, next) {
      next(!!accountStoreMapping.accountStore.provider);
    }, function (accountStoreMappings) {
      if (err) {
        return callback(err);
      }

      // Get the account store, and expand the provider so that we can
      // inspect the provider ID

      async.map(accountStoreMappings, function (accountStoreMapping, next) {
        accountStoreMapping.getAccountStore({ expand: 'provider' }, next);
      }, callback);
    });
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

    // Apply social scopes if they exist
    providers.map(function (accountStore) {
      var socialConfig = config.web.social && config.web.social[accountStore.provider.providerId];
      if (socialConfig) {
        accountStore.provider.scope = socialConfig.scope;
      }
    });

    callback(null, providers);
  });
}

/**
 * Returns an object containing:
 *
 * - A list of all enabled fields, as defined by `form.fields`,
 *   and ordered by `form.fieldOrder`.
 * - A list of providers, such as social providers or SAML providers.
 *
 * <https://github.com/stormpath/stormpath-framework-spec/blob/master/login.md#login-view-model>
 * <https://github.com/stormpath/stormpath-framework-spec/blob/master/registration.md#registration-view-model>
 *
 * @method
 *
 * @param {string} formName - The name of the form (e.g. 'login' or 'register').
 * @param {Object} config - The Stormpath configuration.
 * @param {Function} callback - Callback function (error, model).
 */
function getFormViewModel(formName, config, callback) {
  var cacheTtl = config.client.cacheManager.defaultTtl;
  var cachedModel = getCachedModel(formName, cacheTtl);

  if (cachedModel) {
    return process.nextTick(function () {
      callback(null, cachedModel);
    });
  }

  var form = config.web[formName].form;
  var fields = getFormFields(form);

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

    setCachedModel(formName, model);

    callback(null, model);
  });
}

module.exports = {
  default: getFormViewModel,

  // Expose private functions for testing.
  getFormFields: getFormFields,
  getAccountStores: getAccountStores,
  getAccountStoreModel: getAccountStoreModel,
  getProviders: getProviders
};
