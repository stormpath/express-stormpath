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
 * @returns {Object} The sanitized form data.
 */
module.exports = function (data) {
  if (typeof data !== 'object') {
    throw new Error('Missing data argument.');
  }

  if ('password' in data) {
    delete data['password'];
  }

  if ('confirmPassword' in data) {
    delete data['confirmPassword'];
  }

  return data;
};
