'use strict';

var helpers = require('../helpers');

/**
 * This fixture creates an Express application which has express-stormpath
 * integrated and uses a scope factory.
 *
 * It takes the Stormpath application reference and the requisite scope factory
 * as its fixture constructor arguments. It is assumed that API Keys for
 * Stormpath are already in the environment.
 *
 * @param {object} stormpathApplication
 */
function DefaultExpressApplicationFixtureFixture(stormpathApplication, scopeFactory) {
  this.expressApp = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    web: {
      scopeFactory: scopeFactory
    }
  });
}

module.exports = DefaultExpressApplicationFixtureFixture;
