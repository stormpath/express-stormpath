'use strict';

var helpers = require('../helpers');

var async = require('async');
var uuid = require('uuid');

/**
 * This fixture creates an Express application which has express-stormpath
 * integrated. It does not pass any special options to the express-stormpath
 * init function. This fixture is meant to represent the pure default state of
 * the library when it does not receive any special configuration.
 *
 * The only parameter that this fixture constructor takes is a Stormpath
 * application reference, as we need to know which Stormpath application to use
 * for the initialization of the library. It is assumed that API Keys for
 * Stormpath are already in the environment.
 *
 * @param {object} stormpathApplication
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
    organization: function (next) {
      self.client.createOrganization(self.organization, {createDirectory: true}, next);
    }
  }, function (err, resources) {

    if (err) {
      return done(err);
    }

    self.organization = resources.organization;
    self.config.application = resources.application;

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

      self.expressApp = helpers.createStormpathExpressApp(self.config);
      done();
    });
  });
};

SubdomainMultiTenancyFixture.prototype.after = function after(done) {
  helpers.destroyApplication(this.config.application, done);
};

module.exports = SubdomainMultiTenancyFixture;