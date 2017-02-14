'use strict';

var forms = require('forms');

var fields = forms.fields;
var validators = forms.validators;

/**
 * A form which allows a user to change their password.
 *
 * @property changePasswordForm
 */
module.exports = forms.create({
  password: fields.password({ required: validators.required('Password is required.') }),
  passwordAgain: fields.password({ required: validators.required('Password is required.') })
});
