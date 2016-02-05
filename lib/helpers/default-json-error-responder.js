'use strict';

/**
 * Use this method to render JSON error responses, for errors that arise from
 * the underlying Node SDK
 *
 * @function
 *
 * @param {Object} err - An error object, likely from the Node SDK
 * @param {Object} res - Express http response
 * @param {Object} context - Describe where this error is coming from, for
 * a fallback message when the error does not contain a message.
 */
function defaultJsonErrorResponder(err, res, context) {
  return res.status(err.status || 500).json({
    error: err.userMessage || err.message || ('Unexpected error in ' + context)
  });
}

module.exports = defaultJsonErrorResponder;