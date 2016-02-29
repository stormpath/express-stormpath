'use strict';

var async = require('async');

/**
 * This callback, when called, will pass along a fully expanded Stormpath
 * Account object for future processing.
 *
 * @callback accountCallback
 * @private
 *
 * @param {Object} err - An error (if no account could be retrieved, or one of
 *   the requests failed).
 * @param {Object} account - The fully expanded Stormpath Account object.
 */

/**
 * Given an Account, we'll automatically expand all of the useful linked fields
 * to make working with the Account object easier.
 *
 * @method
 * @private
 *
 * @param {Object} app - The Express application object.
 * @param {Object} account - The Stormpath Account object to expand.
 * @param {accountCallback} - The callback which is called to continue
 *   processing the request.
 */
module.exports = function (account, expand, logger, accountCallback) {
  expand = expand || {};

  // First, we need to expand our user attributes, this ensures the user is
  // fully expanded for easy developer usage.
  async.parallel([
    function (cb) {
      if (!expand.apiKeys) {
        return cb();
      }

      account.getApiKeys(function (err, apiKeys) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s api keys.');
          return accountCallback(err);
        }

        account.apiKeys = apiKeys;
        cb();
      });
    },
    function (cb) {
      if (!expand.customData) {
        return cb();
      }

      account.getCustomData(function (err, customData) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s custom data.');
          return accountCallback(err);
        }

        account.customData = customData;
        cb();
      });
    },
    function (cb) {
      if (!expand.directory) {
        return cb();
      }

      account.getDirectory(function (err, directory) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s directory.');
          return accountCallback(err);
        }

        account.directory = directory;
        cb();
      });
    },
    function (cb) {
      if (!expand.groups) {
        return cb();
      }

      account.getGroups(function (err, groups) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s groups.');
          return accountCallback(err);
        }

        account.groups = groups;
        cb();
      });
    },
    function (cb) {
      if (!expand.groupMemberships) {
        return cb();
      }

      account.getGroupMemberships(function (err, groupMemberships) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s group memberships.');
          return accountCallback(err);
        }

        account.groupMemberships = groupMemberships;
        cb();
      });
    },
    function (cb) {
      if (!expand.providerData) {
        return cb();
      }

      account.getProviderData(function (err, providerData) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s provider data.');
          return accountCallback(err);
        }

        account.providerData = providerData;
        cb();
      });
    },
    function (cb) {
      if (!expand.tenant) {
        return cb();
      }

      account.getTenant(function (err, tenant) {
        if (err) {
          logger.info('Couldn\'t expand ' + account.email + '\'s tenant.');
          return accountCallback(err);
        }

        account.tenant = tenant;
        cb();
      });
    }
  ], function (err) {
    if (err) {
      logger.info(err);
    }

    accountCallback(null, account);
  });
};
