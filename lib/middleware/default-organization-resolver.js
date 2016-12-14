'use strict';

var parseDomain = require('psl').parse;
var helpers = require('../helpers/');

var organizationNameKeyToHrefMap = new helpers.CachedStore();

function defaultOrganizationResolver(req, res, next) {
  var client = req.app.get('stormpathClient');
  var application = req.app.get('stormpathApplication');
  var logger = req.app.get('stormpathLogger');
  var config = req.app.get('stormpathConfig');
  var cacheTtl = config.cacheOptions && config.cacheOptions.ttl !== undefined
    ? config.cacheOptions.ttl
    : config.client.cacheManager.defaultTtl;
  var web = config.web;

  var currentHost = parseDomain(helpers.getHost(req, true));

  function resolveOrganizationByHref(href, callback) {
    client.getOrganization(href, callback);
  }

  function resolveOrganizationByNameKey(nameKey, callback) {
    var organizationHref = organizationNameKeyToHrefMap.getCachedItem(nameKey, cacheTtl);

    if (organizationHref) {
      return resolveOrganizationByHref(organizationHref, callback);
    }

    client.getOrganizations({ nameKey: nameKey }, function (err, collection) {
      if (err) {
        return callback(err);
      }

      var organization = collection.items[0];

      if (organization) {
        organizationNameKeyToHrefMap.setCachedItem(nameKey, organization.href);
      }

      callback(null, organization);
    });
  }

  // Once we have an organization, attach it to the request and
  // continue processing the middleware pipeline.
  function continueWithOrganization(organization) {
    req.organization = organization;
    next();
  }

  // Strategy which tries to resolve an organization from a sub domain.
  // If this step fails then it falls back to resolving an organization from an access token cookie.
  function continueWithSubDomainStrategy() {

    if (web.multiTenancy.strategy === 'subdomain') {

      if ((web.domainName === currentHost.domain) && currentHost.subdomain) {
        return resolveOrganizationByNameKey(currentHost.subdomain, function (err, organization) {

          if (err) {
            return next(err);
          }

          if (!organization) {
            return next();
          }

          helpers.assertOrganizationIsMappedToApplication(organization, application, function (err, isMappedToApp) {
            if (err) {
              return next(err);
            }

            if (isMappedToApp) {
              return continueWithOrganization(organization);
            }

            logger.info('The organization "' + organization.name + '" is not mapped to this application, it will not be used.');

            next();
          });
        });
      }

    }

    next();
  }

  continueWithSubDomainStrategy();
}

module.exports = defaultOrganizationResolver;
