'use strict';

var _ = require('lodash');

/**
 * Returns a view model that can be used for rendering the form template.  It
 * accepts the current stormpath configuration object, and creates a view model
 * which orders fields according to their field order.  If a field is not
 * specified in the field order it will be placed after the defined ones have
 * been placed.
 * @param  {object} stormpathConfig
 * @return {object} fieldModel, with property "fields" which is an ordered array
 * of field objects
 */
function getFormModel(stormpathConfig) {
  var definedFields = stormpathConfig.web.register.fields;
  // Something about the config parsing will create duplicates in this
  // array, if the developer specifies these fields.  Need to investigate.
  var fieldOrder = _.uniq(stormpathConfig.web.register.fieldOrder || []);
  var orderedFields = [];
  // populate the ordered fields first
  fieldOrder.reduce(function (orderedFields, fieldName) {
    var definedField = definedFields[fieldName];
    if (definedField && definedField.enabled) {
      orderedFields.push(definedField);
    }
    return orderedFields;
  }, orderedFields);
  // now add any other fields that were not decalred in the field order
  Object.keys(definedFields).forEach(function (fieldName) {
    var definedField = definedFields[fieldName];
    if (orderedFields.indexOf(definedField) === -1 && definedField.enabled) {
      orderedFields.push(definedField);
    }
  });
  return {
    fields: orderedFields
  };
}

module.exports = getFormModel;