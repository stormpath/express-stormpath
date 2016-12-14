'use strict';

var forms = require('../forms');

var assertOrganizationIsMappedToApplication = require('./assert-org-mapped-to-app');
var collectFormErrors = require('./collect-form-errors');
var isRootDomainMultiTenantRequest = require('./is-root-domain-multi-tenant-request');
var parentDomainRedirect = require('./parent-domain-redirect');
var redirectToOrganization = require('./redirect-to-organization');
var render = require('./render');
var requiresOrganizationResolution = require('./requires-organization-resolution');

/**
* Handles the organization resolving process for multi-tenancy.
*
* Calls that would require organization resolutions (i.e. are made on a sub-domain,
* in an application set up to support multi-tenancy) will be redirected to the
* parent domain for organization selection.
*
* Calls that are made to the root domain will handle the showing or processing
* of the organization name input form, depending on the request method. When
* handled, the processing will be handed over the form the user was originally
* trying to access (login, register, password refresh or e-mail verification flow).
*
* When no processing is needed, the control will be handed to the `next` callback
* without any processing.
*
* The resolver itself is not a part of this guard, and is instead handled by the
* organization resolver middleware.
*
* @method
* @name redirectToOrganizationResolution
*
* @param {Object} req - HTTP request
* @param {Object} res - HTTP response
* @param {String} formActionUri - URI pointing where to redirect the user to
* continue their authorization flow after the organization processing flow is
* completed
* @param {Function} next - The callback to invoke if (and only if) no multi-tenancy
* processing is needed. Never invoked if the this handler does some processing.
*/
module.exports = function organizationResolutionGuard(req, res, formActionUri, next) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var stormpathClient = req.app.get('stormpathClient');

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

  if (requiresOrganizationResolution(req)) {
    return parentDomainRedirect(req, res);
  }

  if (isRootDomainMultiTenantRequest(req)) {
    if (req.method === 'GET') {
      return render(req, res, 'organization-select', {
        form: forms.organizationSelectForm,
        formActionUri: formActionUri,
        formModel: organizationSelectFormModel
      });
    }

    return forms.organizationSelectForm.handle(req, {
      success: function (form) {

        function renderNotFoundError() {
          return render(req, res, config.web.organizationSelect.view, {
            form: form,
            formActionUri: formActionUri,
            formModel: organizationSelectFormModel,
            error: 'Organization could not be bound'
          });
        }
        stormpathClient.getOrganizations({nameKey: form.data.organizationNameKey}, function (err, collection) {

          if (err) {
            return res.json(err);
          }

          if (collection.items.length !== 1) {
            return renderNotFoundError();
          }
          var organization = collection.items[0];

          assertOrganizationIsMappedToApplication(organization, application, function (err, isMappedToApp) {
            if (err) {
              return res.json(err);
            }
            if (isMappedToApp) {
              return redirectToOrganization(req, res, organization);
            }

            logger.info('The organization "' + organization.name + '" is not mapped to this application, it will not be used.');

            return renderNotFoundError();
          });

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