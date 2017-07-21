'use strict';

var helpers = require('../helpers');

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
function DefaultExpressApplicationFixtureFixture(stormpathApplication) {
  this.expressApp = helpers.createOktaExpressApp({
    application: stormpathApplication
  });
}

module.exports = DefaultExpressApplicationFixtureFixture;