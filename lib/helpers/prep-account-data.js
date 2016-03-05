'use strict';

/**
 * @private
 * @callback prepAccountDataCallback
 * @param {Object} accountData - The prepared Stormpath Account data that is now
 *  ready to be created.
 */

/**
 * Takes in form data from a registration request, and converts it into a
 * valid Stormpath account object.
 *
 * This consists of extracting all non-core fields into customData to ensure
 * arbitrary data gets copied over to custom data upon account creation.
 *
 * @param {Object} formData - The user supplied form data.
 * @param {Object} stormpathConfig - The Stormpath configuration object.
 * @param {prepAccountDataCallback} callback - The callback to run.
 */
module.exports = function (formData, stormpathConfig, callback) {
  if (!formData) {
    throw new Error('prepAccountData must be provided with a formData argument.');
  }

  if (!stormpathConfig) {
    throw new Error('prepAccountData must be provided with a stormpathConfig argument.');
  }

  if (!callback) {
    throw new Error('prepAccountData must be provided with a callback argument.');
  }

  var coreFields = [
    'username',
    'email',
    'password',
    'givenName',
    'middleName',
    'surname',
    'status',
    'password'
  ];

  var accountObject = { };

  Object.keys(formData).forEach(function (key) {
    var value = formData[key];
    if (coreFields.indexOf(key) > -1) {
      accountObject[key] = value;
    } else if (key === 'customData') {
      if (accountObject.customData) {
        Object.keys(value).reduce(function (customData, field) {
          customData[field] = value[field];
          return customData;
        }, accountObject.customData);
      } else {
        accountObject.customData = value;
      }
    } else if (key !== 'confirmPassword') {
      if (!accountObject.customData) {
        accountObject.customData = {};
      }
      accountObject.customData[key] = value;
    }
  });

  callback(accountObject);
};
