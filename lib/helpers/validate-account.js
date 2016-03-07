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
  var errors = [];

  getRequiredRegistrationFields(stormpathConfig, function (requiredFields) {
    async.each(requiredFields, function (field, cb) {
      if (accountFieldNames.indexOf(field.name) <= -1 || (accountFieldNames.indexOf(field.name) > -1 && !formData[field.name])) {
        errors.push(new Error((field.label || field.label) + ' required.'));
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
