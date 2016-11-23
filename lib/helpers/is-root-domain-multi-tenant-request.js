'use strict';

var getHost = require('./get-host');

/**
* Checks whether the given request is targeting the root domain, in an application
* configured to handle multi-tenancy using the `subdomain` strategy.
*
* @method
* @private
*
* @param {Object} stormpathConfig - Stormpath configuration
* @param {Object} req - HTTP request
* @return {Boolean} - Whether this is a root domain request in a subdomain
* multi-tenancy flow.
*
*/
module.exports = function isRootDomainMultiTenantRequest(stormpathConfig, req) {
  var domain = getHost(req, true);

  return stormpathConfig.web.multiTenancy.enabled
    && stormpathConfig.web.multiTenancy.strategy === 'subdomain'
    && stormpathConfig.web.domainName
    && domain === stormpathConfig.web.domainName;
};
