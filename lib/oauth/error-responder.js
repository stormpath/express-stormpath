'use strict';

var writeJsonError = require('../helpers/write-json-error');
var renderLoginForm = require('../helpers/render-login-form');

/**
 * Takes an error object and renders the login
 * form with that error.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {Object} config - Stormpath config.
 * @param {Object} err - The error to display.
 */
function renderLoginFormWithError(req, res, config, err) {
  var logger = req.app.get('stormpathLogger');

  logger.info('Provider login error: ' + err.message);

  // Stormpath is unable to create or update the account because the
  // Facebook or Google response did not contain the required property.
  if (err.code === 7201) {
    err.userMessage = 'Login failed, because we could not retrieve your email address from the provider.  Please ensure that you have granted email permission to our application.';
  }

  var options = {
    error: err.userMessage || err.message
  };

  renderLoginForm(req, res, options);
}

/**
 * Takes an error object and responds either by
 * rendering the login form with the error, or
 * by returning the error as JSON.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {Object} err - The error to handle.
 */
function oauthErrorResponder(req, res, err) {
  var accepts = req.accepts(['html', 'json']);
  var config = req.app.get('stormpathConfig');

  if (accepts === 'json') {
    return writeJsonError(res, err);
  }

  return renderLoginFormWithError(req, res, config, err);
}

module.exports = oauthErrorResponder;
