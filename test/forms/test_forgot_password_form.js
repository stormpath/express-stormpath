'use strict';

var assert = require('assert');

var forms = require('../../lib/forms');

describe('forgotPasswordForm', function() {
  it('should require an email', function() {
    var form = forms.forgotPasswordForm.bind({});

    form.validate(function(err) {
      assert.equal(err, 'Email is required.');
    });
  });
});
