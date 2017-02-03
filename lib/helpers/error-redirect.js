'use strict';

/**
 * Use this method to render JSON error responses.
 *
 * @function
 *
 * @param {Object} res - Express http response.
 * @param {Object} err - An error object.
 */
function errorRedirect(res, err) {
  var message = 'Unknown error. Please contact support.';

  if (err) {
    message = err.userMessage || err.message;
  }

  res.redirect('/error?msg=' + message);
}

module.exports = errorRedirect;