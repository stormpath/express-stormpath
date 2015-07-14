'use strict';

var uuid = require('uuid');

var stormpath = require('stormpath');

/**
 * Build a new Stormpath Client for usage in tests.
 *
 * @function
 *
 * @return {Object} Returns an initialized Stormpath Client object.
 */
module.exports.createClient = function() {
  return new stormpath.Client();
};

/**
 * Create a new Stormpath Application for usage in tests.
 *
 * @function
 *
 * @param {Object} client - The Stormpath Client to use.
 * @param {Function} callback - A callback to run when done.
 * @param {Error} err - An error (if there was one).
 * @param {Object} application - The initialized Stormpath Application object.
 */
module.exports.createApplication = function(client, callback) {
  var prefix = uuid.v4();
  var appData = { name: prefix };
  var opts = { createDirectory: true };

  client.createApplication(appData, opts, function(err, app) {
    if (err) return callback(err);
    callback(null, app);
  });
};

/**
 * Destroy an existing Stormpath Application and all of it's Account Stores for
 * cleanup in tests.
 *
 * @function
 *
 * @param {Object} application - The Stormpath Application to destroy.
 * @param {Function} callback - A callback to run when done.
 * @param {Error} err - An error (if there was one).
 */
module.exports.destroyApplication = function(application, callback) {
  application.getAccountStoreMappings(function(err, mappings) {
    if (err) return callback(err);

    mappings.each(function(mapping, cb) {
      mapping.getAccountStore(function(err, store) {
        if (err) return cb(err);

        // Ignore all errors here, because we might be trying to delete a Group
        // which no longer exists.
        store.delete(function(err) {
          cb();
        });
      });
    }, function(err) {
      application.delete(function(appErr) {
        callback(err || appErr);
      });
    });
  });
};
