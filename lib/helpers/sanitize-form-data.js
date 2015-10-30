'use strict';

/**
 * Removes all password data from existing user-submitted form data.
 *
 * This is useful because when a user incorrectly logs in, or registers for a
 * website, we should return all form data to the templates so it can have the
 * pre-filled values populated -- EXCEPT for the password information.  This
 * ensures a password is never sent BACK to a browser.
 *
 * @param {Object} formData - The user supplied form data.
 * @param {Object} stormpathConfig - The Stormpath configuration object.
 * @returns {Object} The sanitized form data.
 */
module.exports = function (formData, stormpathConfig) {
  if (!formData) {
    throw new Error('sanitizeFormData must be provided with a formData argument.');
  }

  if (!stormpathConfig) {
    throw new Error('sanitizeFormData must be provided with a stormpathConfig argument.');
  }

  delete formData[stormpathConfig.web.register.fields.password.name];
  delete formData[stormpathConfig.web.register.fields.passwordConfirm.name];

  return formData;
};
