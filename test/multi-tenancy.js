'use strict';


var SubdomainMultiTenancyFixture = require('./fixtures/subdomain-multi-tenancy');

describe.skip('Subdomain-based Multi Tenancy (when enabled)', function () {

  var fixture = new SubdomainMultiTenancyFixture();

  before(function (done) {
    fixture.before(done);
  });

  after(function (done) {
    fixture.after(done);
  });

  describe('Login Workflow', function () {

    describe('If I visit /login on an invalid subdomain', function () {

      it('Should redirect me to /login on the parent domain', function () {

      });

    });

    describe('If I visit /login on the parent domain', function () {

      it('should present the organization selection form', function () {

      });

      it('should redirect me to <subdomain>/login when I submit a valid organization', function () {

      });

    });

    describe('If I login on a valid subdomain', function () {

      it('Should persist the organization in the access token', function () {

      });

    });

  });

  describe('Registration Workflow', function () {

    describe('If I visit /register on an invalid subdomain', function () {

      it('Should redirect me to /register on the parent domain', function () {

      });

    });

    describe('If I visit /register on the parent domain', function () {

      it('should present the organization selection form', function () {

      });

      it('should redirect me to <subdomain>/register when I submit a valid organization', function () {

      });

    });

    describe('If I register on a valid subdomain, and autoLogin is enabled', function () {

      it('Should persist the organization in the access token', function () {

      });

    });

  });

  describe('Password Reset Workflow', function () {
    describe('If I visit /change?sptoken=<token> on the parent domain', function () {
      it('should present the organization selection form', function () {

      });

      it('should redirect me to <subdomain>/change?sptoken=<token> when I submit a valid organization', function () {

      });
    });

    describe('If I visit /forgot on the parent domain', function () {
      it('should present the organization selection form', function () {

      });

      it('should redirect me to <subdomain>/forgot when I submit a valid organization', function () {

      });
    });

    describe('If I change my password on a valid subdomain, and autoLogin is enabled', function () {

      it('Should persist the organization in the access token', function () {

      });

    });
  });

  describe('Email Verification Workflow', function () {
    describe('If I visit /verify?sptoken=<token> on the parent domain', function () {
      it('should present the organization selection form', function () {

      });

      it('should redirect me to <subdomain>/verify?sptoken=<token> when I submit a valid organization', function () {

      });
    });

    describe('If I visit /verify on the parent domain', function () {
      it('should present the organization selection form', function () {

      });

      it('should redirect me to <subdomain>/verify when I submit a valid organization', function () {

      });
    });
  });

});