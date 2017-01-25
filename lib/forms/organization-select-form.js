'use strict';

var forms = require('forms');
var fields = forms.fields;

/**
* A form for entering the organization that you wish to login to
*
* @property organizationNameKey
*/
module.exports = forms.create({
  organizationNameKey: fields.string()
});
