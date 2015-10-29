'use strict';

var async = require('async');

/**
 * @private
 * @callback prepAccountDataCallback
 * @param {Object} accountData - The prepared Stormpath Account data that is now
 *  ready to be created.
 */

/**
 * Takes in user data from a registration request, and converts it into a
 * Stormpath appropriate form.
 *
 * This consists of extracting all non-core fields into customData to ensure
 * arbitrary data gets copied over upon account creation.
 *
 * @param {Object} formData - The user supplied form data.
 * @param {Object} stormpathConfig - The Stormpath configuration object.
 * @param {prepAccountDataCallback} callback - The callback to run.
 */
module.exports = function (formData, stormpathConfig, callback) {
  var passwordConfirmFieldName = 'passwordConfirm';

  if (!formData) {
    throw new Error('prepAccountData must be provided with a formData argument.');
  }

  if (!stormpathConfig) {
    throw new Error('prepAccountData must be provided with a stormpathConfig argument.');
  }

  if (!callback) {
    throw new Error('prepAccountData must be provided with a callback argument.');
  }

  if (stormpathConfig.web && stormpathConfig.web.register && stormpathConfig.web.register.fields && stormpathConfig.web.register.fields.passwordConfirm && stormpathConfig.web.register.fields.passwordConfirm.name) {
    passwordConfirmFieldName = stormpathConfig.web.register.fields.passwordConfirm.name;
  }

  var coreFields = ['username', 'email', 'password', 'givenName', 'middleName', 'surname', 'status', passwordConfirmFieldName];
  formData.customData = {};

  async.forEachOf(formData, function (value, key, cb) {
    if (coreFields.indexOf(key) === -1 && key !== 'customData') {
      formData.customData[key] = value;
      delete formData[key];
    } else if (key === passwordConfirmFieldName) {
      delete formData[key];
    }

    cb();
  }, function () {
    callback(formData);
  });
};
