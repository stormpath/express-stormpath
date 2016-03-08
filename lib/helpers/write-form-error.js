'use strict';

var render = require('./render');
var sanitizeFormData = require('./sanitize-form-data');

/**
 * Use this method to render form error responses.
 *
 * @function
 *
 * @param {Object} req - Express http request.
 * @param {Object} res - Express http response.
 * @param {Object} view - View to render.
 * @param {Object} viewModel - Model to render the view with.
 * @param {Object} err - Error to render.
 */
module.exports = function writeFormError(req, res, view, viewModel, err) {
  var logger = req.app.get('stormpathLogger');

  logger.info(err);

  // Default to the user message if specified.
  err.message = err.userMessage || err.message;

  render(req, res, view, {
    errors: [err],
    form: sanitizeFormData(req.body),
    formModel: viewModel.form
  });
};