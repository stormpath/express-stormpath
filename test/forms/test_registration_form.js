'use strict';

var assert = require('assert');

var forms = require('../lib/forms');

describe('registrationForm', function() {
  it('should require an email address', function() {
    var form = forms.registrationForm.bind({
      username: 'rdegges',
      givenName: 'Randall',
      surname: 'Degges',
      password: 'blahblahBLAH!1234'
    });

    form.validate(function(err) {
      assert.equal(err, 'Email is required.');
    });
  });

  it('should require a password', function() {
    var form = forms.registrationForm.bind({
      username: 'rdegges',
      givenName: 'Randall',
      surname: 'Degges',
      email: 'randall@stormpath.com'
    });

    form.validate(function(err) {
      assert.equal(err, 'Password is required.');
    });
  });
});
