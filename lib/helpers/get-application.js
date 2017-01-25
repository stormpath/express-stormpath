'use strict';

/**
 * @function
 * @private
 *
 * @description
 * Loads the application from a href, optionally expanding fields passed via the
 * `expand` parameter.
 *
 * @param {String} appHref
 * The HREF of the application to load.
 * @param {Object} client
 * The Stormpath client
 * @param {Object} expand
 * Definition of which objects to expand as an object of string-boolean pairs.
 * @param {Function} callback
 * The function to call when done. Called with {err, Application}
 */
module.exports = function getApplication(appHref, client, expand, callback) {
  var appOptions = {};
  var expandOn = [];

  Object.keys(expand).forEach(function (field) {
    if (expand[field]) {
      expandOn.push(field);
    }
  });

  if (expandOn) {
    appOptions.expand = expandOn.join(',');
  }

  return client.getApplication(appHref, appOptions, callback);
};