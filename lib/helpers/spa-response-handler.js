'use strict';

/**
 * Returns an Express-compatible middleware function that will serve the SPA
 * root file, as defined by the configuration.
 *
 * @param  {Object} stormpathConfig Stormpath config object
 * @return {Function} spaResponseHandler Middleware function that writes the SPA
 * response from the configured file.
 */
module.exports = function spaResponseHandler(stormpathConfig) {
  return function spaResponseHandlerMiddleware(req, res) {
    res.sendFile(stormpathConfig.web.spa.view);
  };
};