'use strict';

/**
 * Translates user creation errors into an end-user friendly userMessage
 * @param {*} err
 */
function oktaErrorTransformer(err) {
  if (err && err.errorCauses) {
    err.errorCauses.forEach(function (cause) {
      if (cause.errorSummary === 'login: An object with this field already exists in the current organization') {
        err.userMessage = 'An account with that email address already exists.';
      } else if (!err.userMessage) {
        // This clause allows the first error cause to be returned to the user
        err.userMessage = cause.errorSummary;
      }
    });
  }
  return err;
}

module.exports = oktaErrorTransformer;