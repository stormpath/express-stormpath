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
  email: fields.string({ required: true }),
  password: fields.password({ required: true })
});


/**
 * A user login form.
 *
 * @property loginForm
 */
module.exports.loginForm = forms.create({
  login: fields.string({ required: true  }),
  password: fields.password({ required: true  })
});


/**
 * A forgot password form.
 *
 * @property forgotPasswordForm
 */
module.exports.forgotPasswordForm = forms.create({
  email: fields.string({ required: true  })
});


/**
 * A form which allows a user to change their password.
 *
 * @property changePasswordForm
 */
module.exports.changePasswordForm = forms.create({
  password: fields.password({ required: true  }),
  passwordAgain: fields.password({ required: true  })
});
