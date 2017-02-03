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
 * @param {Object} formData - The user supplied form data for registration.
 * @param {Object} stormpathConfig - The Stormpath configuration object.
 * @param {validateAccountCallback} callback - The callback to run.
 */
module.exports = function (formData, stormpathConfig, callback) {
  var accountFieldNames = Object.keys(formData);
  var customFieldNames = formData.customData
    ? Object.keys(formData.customData)
    : [];
  var errors = [];

  // Considers `0` and `false` valid values
  function isSet(value) {
    return value !== '' && value !== null && typeof value !== 'undefined';
  }

  function isFieldIncluded(field) {
    // Is it included directly in the core object?
    if (accountFieldNames.indexOf(field.name) >= 0 && isSet(formData[field.name])) {
      return true;
    }

    // Is it included in the custom data?
    if (customFieldNames.indexOf(field.name) >= 0 && isSet(formData.customData[field.name])) {
      return true;
    }

    return false;
  }

  getRequiredRegistrationFields(stormpathConfig, function (requiredFields) {
    async.each(requiredFields, function (field, cb) {
      if (!isFieldIncluded(field)) {
        errors.push(new Error((field.label || field.name) + ' required.'));
      }

      cb();
    }, function () {
      var registerFields = stormpathConfig.web.register.form.fields;
      var confirmPasswordField = registerFields.confirmPassword;

      if (confirmPasswordField && confirmPasswordField.enabled) {
        if (formData.password !== formData.confirmPassword) {
          errors.push(new Error('Passwords do not match.'));
        }
      }

      var coreFields = [
        'username',
        'email',
        'password',
        'givenName',
        'middleName',
        'surname',
        'status',
        'password',
        'customData'
      ];

      /*
        Find all the fields that are not core account fields.  If they are not defined
        in the registration configuration, they should be rejected.
       */
      var configuredFieldNames = Object.keys(registerFields);
      accountFieldNames.concat(Object.keys(formData.customData || {})).forEach(function (fieldName) {
        if (coreFields.indexOf(fieldName) === -1 && configuredFieldNames.indexOf(fieldName) === -1) {
          errors.push(new Error(fieldName + ' is not a configured registration field.'));
        }
      });

      return errors.length ? callback(errors) : callback(null);
    });
  });
};
