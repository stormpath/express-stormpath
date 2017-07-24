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

  // TODO - have this create new apps

  client.getApplication('/apps/' + process.env.OKTA_APPLICATION_ID, callback);

};

/**
 * Create a new Stormpath Organization for usage in tests.
 *
 * @function
 *
 * @param {Object} client - The Stormpath Client to use.
 * @param {Function} callback - A callback to run when done.
 * @param {Error} err - An error (if there was one).
 * @param {Object} application - The initialized Stormpath Application object.
 */
module.exports.createOrganization = function (client, callback) {
  var name = pkg.name + ':' + testRunId + ':' + uuid.v4();

  var organizationData = {
    name: name,
    nameKey: name.replace(/\:/g, '-')
  };

  client.createOrganization(organizationData, callback);
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

module.exports.createOktaExpressApp = function (config, preHandler) {
  config.client = {
    apiToken: process.env.OKTA_APITOKEN,
    application: {
      id: process.env.OKTA_APPLICATION_ID
    },
    org: process.env.OKTA_ORG
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(target) {
  return Object.prototype.toString.call(target) === '[object Object]';
}

function isArray(target) {
  return Object.prototype.toString.call(target) === '[object Array]';
}

/**
 * Takes a snapshot of the current state of the env variables, and Returns
 * a function that can be used to restore it.
 */
module.exports.snapshotEnv = function snapshotEnv() {
  var originalEnv = clone(process.env);
  return function restore() {
    var key;
    for (key in process.env) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (key in originalEnv) {
      process.env[key] = originalEnv[key];
    }
  };
};

module.exports.contains = function contains(container, containee) {
  if ((!containee || !container) && containee !== container) {
    return false;
  }

  if (isArray(containee)) {
    return containee.reduce(function (acc, value) {
      return acc && container.indexOf && container.indexOf(value) !== -1;
    }, true);
  }

  if (isObject(containee)) {
    for (var key in containee) {
      var doesContain;

      if (isObject(containee[key]) || isArray(containee[key])) {
        doesContain = contains(container[key], containee[key]);
      } else {
        doesContain = container[key] === containee[key];
      }

      if (!doesContain) {
        return false;
      }
    }

    return true;
  }

  return container === containee;
};
