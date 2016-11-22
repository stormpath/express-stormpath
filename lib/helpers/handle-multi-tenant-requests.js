'use strict';

var forms = require('../forms');

var collectFormErrors = require('./collect-form-errors');
var isRootDomainMultiTenantRequest = require('./is-root-domain-multi-tenant-request');
var parentDomainRedirect = require('./parent-domain-redirect');
var redirectToOrganization = require('./redirect-to-organization');
var render = require('./render');
var requiresOrganizationResolution = require('./requires-organization-resolution');

module.exports = function (req, res, formActionUri, next) {
  var stormpathClient = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');

  var organizationSelectFormModel = {
    fields: [{
      name: 'organizationNameKey',
      enabled: null,
      visible: true,
      label: config.web.organizationSelect.form.fields.organizationNameKey.label,
      placeholder: config.web.organizationSelect.form.fields.organizationNameKey.placeholder,
      required: true,
      type: 'text'
    }]
  };

  if (requiresOrganizationResolution(config, req)) {
    return parentDomainRedirect(req, res, config);
  }

  if (isRootDomainMultiTenantRequest(config, req)) {
    if (req.method === 'GET') {
      return render(req, res, 'organization-select', {
        form: forms.organizationSelectForm,
        formActionUri: formActionUri,
        formModel: organizationSelectFormModel
      });
    }

    return forms.organizationSelectForm.handle(req, {
      success: function (form) {
        stormpathClient.getOrganizations({nameKey: form.data.organizationNameKey}, function (err, collection) {
          if (err) {
            return res.json(err);
          }

          if (collection.items.length !== 1) {
            return render(req, res, config.web.organizationSelect.view, {
              form: form,
              formActionUri: formActionUri,
              formModel: organizationSelectFormModel,
              error: 'Organization could not be bound'
            });
          }
          var organization = collection.items[0];
          redirectToOrganization(req, res, organization);
        });
      },
      // If we get here, it means the user didn't supply required form fields.
      error: function (form) {
        render(req, res, 'organization-select', {
          form: form,
          formActionUri: formActionUri,
          formModel: organizationSelectFormModel,
          formErrors: collectFormErrors(form)
        });
      },
      // If we get here, it means the user is doing a simple GET request, so we
      // should just render the original template.
      empty: function (form) {
        render(req, res, 'organization-select', {
          form: form,
          formActionUri: formActionUri,
          formModel: organizationSelectFormModel
        });
      }
    });
  }

  next();
};
