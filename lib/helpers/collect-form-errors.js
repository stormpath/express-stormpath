'use strict';

/**
 * Collects errors in a form.
 *
 * @method
 * @private
 *
 * @param  {Object} form - the form to collect errors from.
 * @return {Array} An array of objects that contains the field key and the error message.
 */
module.exports = function (form) {
  var errors = [];

  Object.keys(form.fields).forEach(function (key) {
    if (form.fields.hasOwnProperty(key)) {
      var field = form.fields[key];
      var error = field.error;

      if (error) {
        errors.push({ field: key, error: error });
      }
    }
  });

  return errors;
};
