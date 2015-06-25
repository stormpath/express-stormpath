'use strict';

var assert = require('assert');

var forms = require('../lib/forms');

describe('forgotPasswordForm', function() {
  it('should require an email', function() {
    var form = forms.forgotPasswordForm.bind({});

    form.validate(function(err) {
      assert.equal(err, 'Email is required.');
    });
  });
});

describe('changePasswordForm', function() {
  it('should require a password', function() {
    var form = forms.changePasswordForm.bind({
      passwordAgain: 'blahblahBLAH!1234'
    });

    form.validate(function(err) {
      assert.equal(err, 'Password is required.');
    });
  });

  it('should require a password (again)', function() {
    var form = forms.changePasswordForm.bind({
      password: 'blahblahBLAH!1234'
    });

    form.validate(function(err) {
      assert.equal(err, 'Password is required.');
    });
  });
});
