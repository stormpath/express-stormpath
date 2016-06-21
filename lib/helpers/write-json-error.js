'use strict';

/**
 * Use this method to render JSON error responses.
 *
 * @function
 *
 * @param {Object} res - Express http response.
 * @param {Object} err - An error object.
 */
function writeJsonError(res, err, statusCode) {
  var status = err.status || err.statusCode || statusCode || 400;
  var message = 'Unknown error. Please contact support.';

  if (err) {
    message = err.userMessage || err.message;
  }

  res.status(status);

  res.json({
    status: status,
    message: message
  });

  res.end();
}

module.exports = writeJsonError;