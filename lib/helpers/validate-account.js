'use strict';

var async = require('async');

var getRequiredRegistrationFields = require('./get-required-registration-fields');

/**
 * @private
 * @callback validateAccountCallback
 * @param {Error[]} errors - An array of Account validation errors (if there
 *  are any).  Will be null if no errors are present and the Account is valid.
 */

/**
 * Validate that all required Account data is present and valid before
 * attempting to create an Account on Stormpath.  If any required fields are
 * missing or invalid, an array of errors will be returned.
 *
 * @param {Object} accountData - The user supplied account data.
 * @param {Object} stormpathConfig - The Stormpath configuration object.
 * @param {validateAccountCallback} callback - The callback to run.
 */
module.exports = function (accountData, stormpathConfig, callback) {
  var accountFields = Object.keys(accountData);
  var errors = [];

  getRequiredRegistrationFields(stormpathConfig, function (requiredFields) {
    async.each(requiredFields, function (field, cb) {
      if (accountFields.indexOf(field) <= -1 || (accountFields.indexOf(field) > -1 && !accountData[field])) {
        errors.push(new Error(field + ' required.'));
      }

      cb();
    }, function () {
      if (stormpathConfig.web.register.fields.passwordConfirm.enabled || stormpathConfig.web.register.fields.passwordConfirm.required) {
        var passwordFieldName = stormpathConfig.web.register.fields.password.name;
        var passwordConfirmFieldName = stormpathConfig.web.register.fields.passwordConfirm.name;

        if (accountData[passwordFieldName] && accountData[passwordConfirmFieldName]) {
          if (accountData[passwordFieldName] !== accountData[passwordConfirmFieldName]) {
            errors.push(new Error(passwordFieldName + ' and ' + passwordConfirmFieldName + ' must match.'));
          }
        }
      }

      return errors.length ? callback(errors) : callback(null);
    });
  });
};
