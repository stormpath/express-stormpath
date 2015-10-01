'use strict';

/**
 * Titlecase a string.
 *
 * @param {String} - A string to titlecase.
 * @returns {String} - A titlecased string.
 */
module.exports = function(str) {
  if (!str) {
    throw new Error('str is a required argument.');
  }

  if (typeof str !== 'string') {
    throw new Error('str argument must be of type string.');
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
};
