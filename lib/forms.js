var forms = require('forms');

var fields = forms.fields;
var validators = forms.validators;


module.exports.registrationForm = forms.create({
  username: fields.string(),
  givenName: fields.string(),
  middleName: fields.string(),
  surname: fields.string(),
  email: fields.string({ required: true }),
  password: fields.password({ required: true })
});


module.exports.loginForm = forms.create({
  login: fields.string({ required: true  }),
  password: fields.password({ required: true  })
})
