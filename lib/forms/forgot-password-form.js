'use strict';

var forms = require('forms');

var fields = forms.fields;
var validators = forms.validators;

/**
 * A forgot password form.
 *
 * @property forgotPasswordForm
 */
module.exports = forms.create({
  email: fields.email({ required: validators.required('Email is required.') })
});
