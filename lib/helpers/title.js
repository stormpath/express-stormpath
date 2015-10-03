'use strict';

/**
 * Titlecase a string.
 *
 * @method
 * @private
 *
 * @param {String} - A string to titlecase.
 *
 * @return {String} A titlecased string.
 */
module.exports = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
