'use strict';


var forms = require('forms');

var fields = forms.fields;
var validators = forms.validators;


/**
 * A user registration form.
 *
 * @property
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
 * @property
 */
module.exports.loginForm = forms.create({
  login: fields.string({ required: true  }),
  password: fields.password({ required: true  })
});
