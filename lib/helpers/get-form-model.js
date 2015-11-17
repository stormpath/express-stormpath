'use strict';

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
  // /* eslint no-console: 1*/
  // console.log('getFormModel', stormpathConfig.web.register);
  var definedFields = stormpathConfig.web.register.fields;
  var fieldOrder = stormpathConfig.web.register.fieldOrder || [];
  var orderedFields = [];
  fieldOrder.reduce(function (orderedFields, fieldName) {
    var definedField = definedFields[fieldName];
    if (definedField) {
      orderedFields.push(definedField);
    }
    return orderedFields;
  }, orderedFields);
  Object.keys(definedFields).forEach(function (fieldName) {
    var definedField = definedFields[fieldName];
    if (orderedFields.indexOf(definedField) === -1) {
      orderedFields.push(definedField);
    }
  });
  // console.log('orderedFields', orderedFields);
  return {
    fields: orderedFields
  };
}

module.exports = getFormModel;