'use strict';

/**
 * Handles an HTTP Accept request.
 *
 * @method
 * @private
 *
 * @param {Object} req - HTTP request.
 * @param {Object} res - HTTP response.
 * @param {Object} handlers - Object where the key is the content type's available to accept.
 * @param {function} fallbackHandler - Handler to call when no content type was accepted.
 */
function handleAcceptRequest(req, res, handlers, fallbackHandler) {
  var config = req.app.get('stormpathConfig');
  var accepted = req.accepts(config.web.produces);

  if (!accepted || !(accepted in handlers)) {
    return fallbackHandler();
  }

  // If this is a text/html response, then check if we have SPA-mode enabled.
  // If it is enabled, then return the view for it.
  if (accepted === 'text/html' && config.web.spa.enabled) {
    return res.sendFile(config.web.spa.view);
  }

  handlers[accepted]();
}

module.exports = handleAcceptRequest;