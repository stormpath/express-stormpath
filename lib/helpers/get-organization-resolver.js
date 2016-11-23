'use strict';

var forms = require('../forms');

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
* @method
* @name defaultOrganizationResolver
*
* @param {Object} req - HTTP request
* @param {Object} res - HTTP response
* @param {String} formActionUri - URI pointing where to redirect the user to
* continue their authorization flow after the organization processing flow is
* completed
* @param {Function} next - The callback to invoke if (and only if) no multi-tenancy
* processing is needed. Never invoked if the this handler does some processing.
*/
function defaultOrganizationResolver(req, res, formActionUri, next) {
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
}

/**
* Retrieves an organization resolver to use for multi-tenant authorization. It
* will use a resolver registered in the configuration as
* `web.multiTenancy.organizationResolver`, if one is defined, and is a function.
* Otherwise, the {@link defaultOrganizationResolver} is returned.
*
* This function must adhere to the following contract:
* <ul>
*   <li>It must take a HTTP request as the first argument</li>
*   <li>It must take a HTTP response as the second argument</li>
*   <li>
*     It must take an URL as the third argument. This url is used to redirect
*     the user back to the originally used authorization flow, if the resolver
*     completes successfully.
*   </li>
*   <li>
*     It must take a callback as the fourth argument. This callback should be
*     invoked if and only if the resolver determines that it does not have to
*     start the organization resolving process.
*   </li>
* </ul>
*
* @method
*
* @param {Object} config - Express stormpath configuration
* @return {Function} Organization resolver function
*/
module.exports = function (config) {
  var configuredResolver = config.web.multiTenancy.organizationResolver;

  return (configuredResolver && typeof configuredResolver === 'function')
       ? configuredResolver
       : defaultOrganizationResolver;
};
