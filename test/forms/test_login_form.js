'use strict';

var assert = require('assert');

var forms = require('../lib/forms');

describe('loginForm', function() {
  it('should require a login', function() {
    var form = forms.loginForm.bind({
      password: 'blahblahBLAH!1234'
    });

    form.validate(function(err) {
      assert.equal(err, 'Login is required.');
    });
  });

  it('should require a password', function() {
    var form = forms.loginForm.bind({
      login: 'randall@stormpath.com'
    });

    form.validate(function(err) {
      assert.equal(err, 'Password is required.');
    });
  });
});
