'use strict';

var helpers = require('../helpers');

/**
 * This fixture creates an Express application which has express-stormpath
 * integrated, but with the Oauth2 endpoint disabled.
 *
 * The only parameter that this fixture constructor takes is a Stormpath
 * application reference, as we need to know which Stormpath application to use
 * for the initialization of the library. It is assumed that API Keys for
 * Stormpath are already in the environment.
 *
 * @param {object} stormpathApplication
 */
function Oauth2DisabledFixture(stormpathApplication) {
  this.expressApp = helpers.createStormpathExpressApp({
    application: stormpathApplication,
    web: {
      oauth2: {
        enabled: false
      }
    }
  });
}

module.exports = Oauth2DisabledFixture;