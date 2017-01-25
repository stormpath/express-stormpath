'use strict';

var uuid = require('uuid');

var stormpathExpress = require('../');

var express = require('express');

var pkg = require('../package.json');

var testRunId = uuid.v4().split('-')[0];

var stormpath = require('stormpath');

/**
 * Build a new Stormpath Client for usage in tests.
 *
 * @function
 *
 * @return {Object} Returns an initialized Stormpath Client object.
 */
module.exports.createClient = function (opts) {
  return new stormpath.Client(opts);
};

/**
 * Builds an object that can be used to create a new Stormpath account
 *
 * @function
 *
 * @return {Object} Object literal for passing to createAccount functions.
 */
module.exports.newUser = function () {
  return {
    givenName: uuid.v4(),
    surname: uuid.v4(),
    email: 'robert+' + uuid.v4() + '@stormpath.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };
};

/**
 * Retrieves the account schema fields for an Application's default account store.
 *
 * @function
 *
 * @param {Object} application Application to retrieve account schema fields for.
 * @param {Function} callback Called when account schema fields are retrieved.
 */
module.exports.getApplicationDefaultSchemaFields = function (application, callback) {
  application.getAccountStoreMappings(function (err, accountStoreMappings) {
    if (err) {
      return callback(err);
    }

    var defaultMapping = accountStoreMappings.items[0];

    defaultMapping.getAccountStore(function (err, accountStore) {
      if (err) {
        return callback(err);
      }

      accountStore.getAccountSchema(function (err, accountSchema) {
        if (err) {
          return callback(err);
        }

        accountSchema.getFields(callback);
      });
    });
  });
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
module.exports.createApplication = function (client, callback) {
  var appData = { name: pkg.name + ':' + testRunId + ':' + uuid.v4() };
  var opts = { createDirectory: true };

  client.createApplication(appData, opts, callback);
};

/**
 * Set the status (enabled or disabled) of the email verification property
 * on the account creation policy, for the default account store of the
 * given directory
 *
 * Assumes that the default account store is a directory
 *
 * @param  {Object} application
 * @param {Function} callback Called when updating is complete
 */
module.exports.setEmailVerificationStatus = function (application, status, cb) {
  function done(err) {
    if (err) {
      throw err;
    } else {
      cb();
    }
  }
  application.getDefaultAccountStore(function (err, accountStoreMapping) {
    if (err) {
      done(err);
    } else {
      accountStoreMapping.getAccountStore(function (err, directory) {
        if (err) {
          done(err);
        } else {
          directory.getAccountCreationPolicy(function (err, policy) {
            if (err) {
              done(err);
            } else {
              policy.verificationEmailStatus = status;
              policy.save(done);
            }
          });
        }
      });

    }
  });
};

/**
 * Set the status (enabled or disabled) of the resetEmailStatus property
 * on the password policy, for the default account store of the given directory.
 *
 * Assumes that the default account store is a directory.
 *
 * @param  {Object} application
 * @param {Function} callback Called when updating is complete
 */
module.exports.setPasswordResetStatus = function (application, status, cb) {
  function done(err) {
    if (err) {
      throw err;
    } else {
      cb();
    }
  }
  application.getDefaultAccountStore(function (err, accountStoreMapping) {
    if (err) {
      done(err);
    } else {
      accountStoreMapping.getAccountStore(function (err, directory) {
        if (err) {
          done(err);
        } else {
          directory.getPasswordPolicy(function (err, policy) {
            if (err) {
              done(err);
            } else {
              policy.resetEmailStatus = status;
              policy.save(done);
            }
          });
        }
      });
    }
  });
};

module.exports.createStormpathExpressApp = function (config, preHandler) {
  config.client = {
    apiKey: {
      id: process.env.STORMPATH_CLIENT_APIKEY_ID,
      secret: process.env.STORMPATH_CLIENT_APIKEY_SECRET
    }
  };

  var app = express();

  if (preHandler) {
    app.use(preHandler);
  }

  app.use(stormpathExpress.init(app, config));

  return app;
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
module.exports.destroyApplication = function (application, callback) {
  application.getAccountStoreMappings(function (err, mappings) {
    if (err) {
      return callback(err);
    }

    mappings.each(function (mapping, cb) {
      mapping.getAccountStore(function (err, store) {
        if (err) {
          return cb(err);
        }

        // Ignore all errors here, because we might be trying to delete a Group
        // which no longer exists.
        store.delete(cb);
      });
    }, function (err) {
      if (err) {
        return callback(err);
      }

      application.delete(function (err) {
        callback(err);
      });
    });
  });
};

/**
 * A logger implementation that does not do anything, useful for tests where you
 * want to silence the default logger.
 * @type {Object}
 */
module.exports.noOpLogger = {
  info: function () {},
  error: function () {}
};
