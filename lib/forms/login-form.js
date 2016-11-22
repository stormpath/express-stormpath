'use strict';

var forms = require('forms');

var fields = forms.fields;
var validators = forms.validators;

/**
 * A user login form.
 *
 * @property loginForm
 */
module.exports = forms.create({
  login: fields.string({ required: validators.required('Login is required.') }),
  password: fields.password({ required: validators.required('Password is required.') })
});
