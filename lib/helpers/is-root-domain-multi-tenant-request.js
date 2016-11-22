'use strict';

var getHost = require('./get-host');

module.exports = function isRootDomainMultiTenantRequest(stormpathConfig, req) {
  var domain = getHost(req, true);

  return stormpathConfig.web.multiTenancy.enabled
    && stormpathConfig.web.multiTenancy.strategy === 'subdomain'
    && stormpathConfig.web.domainName
    && domain === stormpathConfig.web.domainName;
};
