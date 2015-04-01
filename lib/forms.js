'use strict';


var forms = require('forms');

var fields = forms.fields;
var validators = forms.validators;


/**
 * A user registration form.
 *
 * @property registrationForm
 */
module.exports.registrationForm = forms.create({
  username: fields.string(),
  givenName: fields.string(),
  middleName: fields.string(),
  surname: fields.string(),
  email: fields.email({ required: validators.required('Email is required.') }),
  password: fields.password({ required: validators.required('Password is required.') }),
  confirmPassword: fields.password({
    validators: [validators.matchField('password', 'Password and Confirm Password must match.')]
  })
});


/**
 * A user login form.
 *
 * @property loginForm
 */
module.exports.loginForm = forms.create({
  login: fields.string({ required: validators.required('Login is required.') }),
  password: fields.password({ required: validators.required('Password is required.') })
});


/**
 * A resend account verification email form.
 *
 * @property resendAccountVerificationEmailForm
 */
module.exports.resendAccountVerificationEmailForm = forms.create({
  email: fields.email({ required: validators.required('Email is required.') })
});


/**
 * A forgot password form.
 *
 * @property forgotPasswordForm
 */
module.exports.forgotPasswordForm = forms.create({
  email: fields.email({ required: validators.required('Email is required.') })
});


/**
 * A form which allows a user to change their password.
 *
 * @property changePasswordForm
 */
module.exports.changePasswordForm = forms.create({
  password: fields.password({ required: validators.required('Password is required.') }),
  passwordAgain: fields.password({ required: validators.required('Password is required.') })
});
