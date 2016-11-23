'use strict';

var getHost = require('./get-host');

/**
* Determines whether organization resolution is required for multi-tenancy
* subdomain flow. Used only in the subdomain multi-tenancy resolution flow.
*
* @param {Object} req - HTTP request
* @return {Boolean} - Whether organization resolution is required
*/
module.exports = function (req) {
  var config = req.app.get('stormpathConfig');

  return config.web.multiTenancy.enabled
    && config.web.multiTenancy.strategy === 'subdomain'
    && config.web.domainName
    && getHost(req, true) !== config.web.domainName
    && !req.organization;
};
