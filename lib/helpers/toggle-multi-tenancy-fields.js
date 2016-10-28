'use strict';

var _ = require('lodash');

/**
 * Takes a view model and toggles form fields related to
 * multi tenancy depending on the state of the provided request.
 *
 * @method
 *
 * @param {Object} req - The request.
 * @param {Object} viewModel - The view model to toggle fields in.
 */
module.exports = function toggleMultiTenancyFields(req, viewModel) {
  var config = req.app.get('stormpathConfig');

  viewModel.form.fields = _.filter(viewModel.form.fields, function (field) {
    return field.name !== 'organizationNameKey' || (config.web.multiTenancy.enabled && !req.organization);
  });
};