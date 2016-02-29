'use strict';

var async = require('async');

/**
 * @private
 * @callback getRequiredRegistrationFieldsCallback
 * @param {Array} fields - An array of required field names (as strings). Might
 *  be empty if the user explicitly disables all fields in the configuration.
 */

/**
 * Gets a list of required registration fields.
 *
 * @param {Object} config - The Stormpath Configuration object.
 * @param {getRequiredRegistrationFieldsCallback} callback - The callback to
 *  run.
 */
module.exports = function (config, callback) {
  var fields = [];

  if (!config || !config.web || !config.web.register) {
    return callback([]);
  }

  async.forEachOf(config.web.register.form.fields || {}, function (field, fieldName, cb) {
    if (field && field.enabled && field.required) {
      field.name = fieldName;
      fields.push(field);
    }

    cb();
  }, function () {
    callback(fields);
  });
};
