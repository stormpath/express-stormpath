'use strict';

var forms = require('forms');

var fields = forms.fields;
var validators = forms.validators;

/**
 * A resend account verification email form.
 *
 * @property resendAccountVerificationEmailForm
 */
module.exports = forms.create({
  email: fields.email({ required: validators.required('Email is required.') })
});
