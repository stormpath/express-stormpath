'use strict';

var assert = require('assert');
var uuid = require('uuid');

var request = require('supertest');

var SubdomainMultiTenancyFixture = require('./fixtures/subdomain-multi-tenancy');

describe('Subdomain-based Multi Tenancy (when enabled)', function () {

  var fixture = new SubdomainMultiTenancyFixture();

  before(function (done) {
    fixture.before(done);
  });

  after(function (done) {
    fixture.after(done);
  });

  describe('Login Workflow', function () {

    describe('If I visit /login on an invalid subdomain', function () {

      it('Should redirect me to /login on the parent domain', function (done) {
        request(fixture.expressApp)
          .get('/login')
          .set('Host', 'foo.' + fixture.config.web.domainName)
          .expect('Location', 'http://' + fixture.config.web.domainName + '/login')
          .end(done);
      });

    });

    describe('If I visit /login on the parent domain', function () {

      it('should present the organization selection form', function (done) {
        request(fixture.expressApp)
          .get('/login')
          .set('Host', fixture.config.web.domainName)
          .end(fixture.assertOrganizationSelectForm.bind(fixture, done));
      });

      it('should redirect me to <subdomain>/login when I submit a valid organization', function (done) {
        request(fixture.expressApp)
          .post('/login')
          .set('Host', fixture.config.web.domainName)
          .send({
            organizationNameKey: fixture.organization.nameKey
          })
          .expect('Location', 'http://' + fixture.organization.nameKey + '.' + fixture.config.web.domainName + '/login')
          .end(done);
      });

    });

    describe('If I login on a valid subdomain', function () {

      it('Should persist the organization in the access token', function (done) {
        request(fixture.expressApp)
          .post('/login')
          .type('json')
          .set('Host', fixture.organization.nameKey + '.' + fixture.config.web.domainName)
          .send({
            login: fixture.account.email,
            password: fixture.account.password
          })
          .expect('Set-Cookie', /access_token=[^;]+/)
          .end(fixture.assertTokenContainsOrg.bind(fixture, done));
      });

    });

  });

  describe('Registration Workflow', function () {

    describe('If I visit /register on an invalid subdomain', function () {
      it('Should redirect me to /register on the parent domain', function (done) {
        request(fixture.expressApp)
          .get('/register')
          .set('Host', 'foo.' + fixture.config.web.domainName)
          .expect('Location', 'http://' + fixture.config.web.domainName + '/register')
          .end(done);
      });
    });

    describe('If I visit /register on the parent domain', function () {
      it('should present the organization selection form', function (done) {
        request(fixture.expressApp)
          .get('/register')
          .set('Host', fixture.config.web.domainName)
          .end(fixture.assertOrganizationSelectForm.bind(fixture, done));
      });

      it('should redirect me to <subdomain>/register when I submit a valid organization', function (done) {
        request(fixture.expressApp)
          .post('/register')
          .set('Host', fixture.config.web.domainName)
          .send({
            organizationNameKey: fixture.organization.nameKey
          })
          .expect('Location', 'http://' + fixture.organization.nameKey + '.' + fixture.config.web.domainName + '/register')
          .end(done);
      });
    });

    describe('If I register on a valid subdomain, and autoLogin is enabled', function () {
      it('Should persist the organization in the access token', function (done) {
        var user = {
          givenName: uuid.v4(),
          surname: uuid.v4(),
          email: uuid.v4() + '@test.com',
          password: uuid.v4() + uuid.v4().toUpperCase() + '!'
        };

        request(fixture.expressApp)
        .post('/register')
          .type('json')
          .set('Host', fixture.organization.nameKey + '.' + fixture.config.web.domainName)
          .send(user)
          .expect('Set-Cookie', /access_token=[^;]+/)
          .end(fixture.assertTokenContainsOrg.bind(fixture, done));
      });
    });
  });


  describe('Password Reset Workflow', function () {
    describe('If I visit /change?sptoken=<token> on the parent domain', function () {
      it('should present the organization selection form', function (done) {
        request(fixture.expressApp)
          .get('/change?sptoken=tokenhere')
          .set('Host', fixture.config.web.domainName)
          .end(fixture.assertOrganizationSelectForm.bind(fixture, done));
      });

      it('should redirect me to <subdomain>/change?sptoken=<token> when I submit a valid organization', function (done) {
        request(fixture.expressApp)
          .post('/change?sptoken=tokenhere')
          .set('Host', fixture.config.web.domainName)
          .send({
            organizationNameKey: fixture.organization.nameKey
          })
          .expect('Location', 'http://' + fixture.organization.nameKey + '.' + fixture.config.web.domainName + '/change?sptoken=tokenhere')
          .end(done);
      });
    });

    describe('If I visit /forgot on the parent domain', function () {
      it('should present the organization selection form', function (done) {
        request(fixture.expressApp)
          .get('/forgot')
          .set('Host', fixture.config.web.domainName)
          .end(fixture.assertOrganizationSelectForm.bind(fixture, done));
      });

      it('should redirect me to <subdomain>/forgot when I submit a valid organization', function (done) {
        request(fixture.expressApp)
          .post('/forgot')
          .set('Host', fixture.config.web.domainName)
          .send({
            organizationNameKey: fixture.organization.nameKey
          })
          .expect('Location', 'http://' + fixture.organization.nameKey + '.' + fixture.config.web.domainName + '/forgot')
          .end(done);
      });
    });

    describe('If I change my password on a valid subdomain, and autoLogin is enabled', function () {

      it('Should persist the organization in the access token', function () {

      });

    });
  });

  describe('Email Verification Workflow', function () {
    describe('If I visit /verify?sptoken=<token> on the parent domain', function () {
      it('should present the organization selection form', function (done) {
        request(fixture.emailVerificationApp)
          .get('/verify?sptoken=tokenhere')
          .set('Host', fixture.config.web.domainName)
          .end(fixture.assertOrganizationSelectForm.bind(fixture, done));
      });

      it('should redirect me to <subdomain>/verify?sptoken=<token> when I submit a valid organization', function (done) {
        request(fixture.emailVerificationApp)
          .post('/verify?sptoken=tokenhere')
          .set('Host', fixture.config.web.domainName)
          .send({
            organizationNameKey: fixture.organization.nameKey
          })
          .expect('Location', 'http://' + fixture.organization.nameKey + '.' + fixture.config.web.domainName + '/verify?sptoken=tokenhere')
          .end(done);
      });
    });

    describe('If I visit /verify on the parent domain', function () {
      it('should present the organization selection form', function (done) {
        request(fixture.emailVerificationApp)
          .get('/verify')
          .set('Host', fixture.config.web.domainName)
          .end(fixture.assertOrganizationSelectForm.bind(fixture, done));
      });

      it('should redirect me to <subdomain>/verify when I submit a valid organization', function (done) {
        request(fixture.emailVerificationApp)
          .post('/verify')
          .set('Host', fixture.config.web.domainName)
          .send({
            organizationNameKey: fixture.organization.nameKey
          })
          .expect('Location', 'http://' + fixture.organization.nameKey + '.' + fixture.config.web.domainName + '/verify')
          .end(done);
      });
    });
  });

});
