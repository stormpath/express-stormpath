'use strict';

var getHost = require('./get-host');

/**
* Checks whether the given request is targeting the root domain, in an application
* configured to handle multi-tenancy using the `subdomain` strategy.
*
* @method
* @private
*
* @param {Object} req - HTTP request
* @return {Boolean} - Whether this is a root domain request in a subdomain
* multi-tenancy flow.
*
*/
module.exports = function isRootDomainMultiTenantRequest(req) {
  var domain = getHost(req, true);
  var config = req.app.get('stormpathConfig');

  return config.web.multiTenancy.enabled
    && config.web.multiTenancy.strategy === 'subdomain'
    && config.web.domainName
    && domain === config.web.domainName;
};
