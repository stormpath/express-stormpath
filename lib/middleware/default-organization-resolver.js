'use strict';

var parseDomain = require('psl').parse;
var helpers = require('../helpers/');

var organizationNameKeyToHrefMap = {};

function defaultOrganizationResolver(req, res, next) {
  var client = req.app.get('stormpathClient');
  var application = req.app.get('stormpathApplication');
  var logger = req.app.get('stormpathLogger');
  var config = req.app.get('stormpathConfig');
  var web = config.web;

  var currentHost = parseDomain(helpers.getHost(req, true));

  function resolveOrganizationByHref(href, callback) {
    client.getOrganization(href, callback);
  }

  function resolveOrganizationByNameKey(nameKey, callback) {
    var organizationHref = organizationNameKeyToHrefMap[nameKey];

    if (organizationHref) {
      return resolveOrganizationByHref(organizationHref, callback);
    }

    client.getOrganizations({ nameKey: nameKey }, function (err, collection) {
      if (err) {
        return callback(err);
      }

      var organization = collection.items[0];

      if (organization) {
        organizationNameKeyToHrefMap[nameKey] = organization.href;
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

  function assertOrganizationIsMappedToApplication(organization, cb) {
    application.getAccountStoreMappings(function (err, mappings) {
      if (err) {
        return cb(err);
      }

      mappings.some(function (mapping, next) {
        next(mapping.accountStore.href === organization.href);
      }, function (hasMatch) {
        cb(null, hasMatch);
      });
    });
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

          assertOrganizationIsMappedToApplication(organization, function (err, isMappedToApp) {
            if (err) {
              return next(err);
            }

            if (isMappedToApp) {
              return continueWithOrganization(organization);
            }

            logger.info('Chosen organization during organization resolve is not mapped to this application');

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
