'use strict';

var helpers = require('../helpers');

var assert = require('assert');
var async = require('async');
var cheerio = require('cheerio');
var njwt = require('njwt');
var uuid = require('uuid');

/**
 * This fixture creates a Stormpath application that has an organization mapped
 * to it.  It also creates an account in that organization, for testing
 * authenticatio against the organization.
 */
function SubdomainMultiTenancyFixture() {
  this.client = helpers.createClient();
  this.expressApp = null;
  this.organization = {
    name: uuid.v4(),
    nameKey: uuid.v4()
  };
  this.account = helpers.newUser();

  this.config = {
    web: {
      domainName: 'localhost.com',
      multiTenancy: {
        enabled: true
      },
      register: {
        autoLogin: true
      }
    }
  };

  this.emailVerificationConfig = {
    web: {
      domainName: 'localhost.com',
      multiTenancy: {
        enabled: true
      },
      verifyEmail: {
        enabled: true
      }
    }
  };
}

SubdomainMultiTenancyFixture.prototype.before = function before(done) {
  var self = this;

  async.parallel({
    application: function (next) {
      helpers.createApplication(self.client, next);
    },
    emailVerificationApplication: function (next) {
      helpers.createApplication(self.client, next);
    },
    organization: function (next) {
      self.client.createOrganization(self.organization, {createDirectory: true}, next);
    }
  }, function (err, resources) {

    if (err) {
      return done(err);
    }

    self.organization = resources.organization;
    self.config.application = resources.application;
    self.emailVerificationConfig.application = resources.emailVerificationApplication;

    async.parallel({
      account: function (next) {
        self.organization.createAccount(self.account, next);
      },
      mapping: function (next) {
        resources.application.createAccountStoreMapping({accountStore: self.organization}, next);
      }
    }, function (err) {
      if (err) {
        return done(err);
      }

      async.parallel({
        expressApp: function (next) {
          next(null, helpers.createStormpathExpressApp(self.config));
        },
        emailVerificationApp: function (next) {
          helpers.setEmailVerificationStatus(resources.emailVerificationApplication, 'ENABLED', function () {
            next(null, helpers.createStormpathExpressApp(self.emailVerificationConfig));
          });
        }
      }, function (err, apps) {
        if (err) {
          return done(err);
        }

        self.expressApp = apps.expressApp;
        self.emailVerificationApp = apps.emailVerificationApp;
        done();
      });
    });
  });
};

SubdomainMultiTenancyFixture.prototype.after = function after(done) {
  var self = this;

  async.parallel({
    basic: function (next) {
      helpers.destroyApplication(self.config.application, next);
    },
    email: function (next) {
      helpers.destroyApplication(self.emailVerificationConfig.application, next);
    }
  }, function (err) {
    if (err) {
      return done(err);
    }

    done();
  });
};

SubdomainMultiTenancyFixture.prototype.assertTokenContainsOrg = function assertTokenContainsOrg(done, err, res) {
  if (err) {
    return done(err);
  }
  var token = (res.headers['set-cookie'] || []).join('').match(/access_token=([^;]+)/)[1];
  var jwt = njwt.verify(token, this.config.client.apiKey.secret);
  assert.equal(jwt.body.org, this.organization.href);
  done();

};

SubdomainMultiTenancyFixture.prototype.assertOrganizationSelectForm = function assertOrganizationSelectForm(done, err, res) {
  if (err) {
    return done(err);
  }
  var $ = cheerio.load(res.text);

  assert.equal($('input[name="organizationNameKey"]').length, 1, 'Could not find organizationNameKey field in response HTML');
  done();
};
module.exports = SubdomainMultiTenancyFixture;
