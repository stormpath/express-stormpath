'use strict';

/**
 * Handles a content type request.
 *
 * @method
 * @private
 *
 * @param {Object} req - HTTP request.
 * @param {Object} handlers - Object where the key is the content type to handle.
 * @param {function} fallbackHandler - Handler to call when no content type was matched.
 */
function handleContentTypeRequest(req, handlers, fallbackHandler) {
  var config = req.app.get('stormpathConfig');
  var accepted = req.accepts(config.web.produces);

  if (!accepted || !(accepted in handlers)) {
    return fallbackHandler();
  }

  handlers[accepted]();
}

module.exports = handleContentTypeRequest;