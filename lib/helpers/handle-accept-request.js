'use strict';

var _ = require('lodash');
var spaResponseHandler = require('./spa-response-handler');

/**
 * Determines which handler should be used to fulfill a response, given the
 * Accept header of the request and the content types that are allowed by the
 * `stormpath.web.produces` configuration.  Also handles the serving of the SPA
 * root page, if needed.
 *
 * @method
 * @private
 *
 * @param {Object} req - HTTP request.
 * @param {Object} res - HTTP response.
 * @param {Object} handlers - Object where the keys are content types and the
 * functions are handlers that will be called, if needed, to fulfill the
 * response as that type.
 * @param {Function} fallbackHandler - Handler to call when an acceptable
 * content type could not be resolved.
 */
function handleAcceptRequest(req, res, handlers, fallbackHandler) {
  var config = req.app.get('stormpathConfig');

  // Accepted is an ordered list of preferred types, as specified by the request.
  var accepted = req.accepts();
  var produces = config.web.produces;
  var defaultContentType = produces && produces.length >= 1
    ? produces[0]
    : 'text/html';

  // Our default response is the first entry in the `produces` array, if the
  // request does not specify otherwise via the `Accepts` header.
  accepted = accepted.map(function (contentType) {
    return contentType === '*/*' ? defaultContentType : contentType;
  });

  // Of the accepted types, find the ones that are allowed by the configuration.
  var allowedResponseTypes = _.intersection(produces, accepted);

  // Of the allowed response types, find the first handler that matches. But
  // always override with the SPA handler if SPA is enabled.
  var handler;

  allowedResponseTypes.some(function (contentType) {
    if (config.web.spa.enabled && contentType === 'text/html') {
      handler = spaResponseHandler(config);
      return true;
    }

    if (contentType in handlers) {
      handler = handlers[contentType];
      return true;
    }
  });

  if (!handler) {
    return fallbackHandler();
  }

  handler(req, res);
}

module.exports = handleAcceptRequest;