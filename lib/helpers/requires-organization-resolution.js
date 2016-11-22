'use strict';

var getHost = require('./get-host');

module.exports = function (config, req) {
  return config.web.multiTenancy.enabled
    && config.web.multiTenancy.strategy === 'subdomain'
    && config.web.domainName
    && getHost(req, true) !== config.web.domainName
    && !req.organization;
};
