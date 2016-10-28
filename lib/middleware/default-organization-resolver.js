'use strict';

var stormpath = require('stormpath');
var parseDomain = require('psl').parse;
var helpers = require('../helpers/');

var organizationCache = {};
var organizationNameToHrefMap = {};

/**
 * Returns the cached model if it's not older than `ttl`.
 * Else it returns null.
 *
 * @method
 *
 * @param {string} href - Href of the organization to retrieve from cache.
 */
function getCachedOrganization(href) {
  var cacheItem = organizationCache[href];

  if (!cacheItem) {
    return null;
  }

  return cacheItem.organization;
}

/**
 * Cache an organization.
 *
 * @method
 *
 * @param {Object} organization - The organization to cache.
 */
function setCachedOrganization(organization, ttl) {
  var href = organization.href;

  var cacheTimeoutId = setTimeout(function () {
    delete organizationCache[href];
  }, ttl);

  organizationCache[href] = {
    organization: organization,
    cacheTimeoutId: cacheTimeoutId
  };
}

function defaultOrganizationResolver(req, res, next) {
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var application = req.app.get('stormpathApplication');
  var web = config.web;

  var cacheTtl = config.cacheOptions && config.cacheOptions.ttl !== undefined ? config.cacheOptions.ttl : config.client.cacheManager.defaultTtl;

  function resolveOrganizationByHref(client, href, callback) {
    var organization = getCachedOrganization(href);

    if (organization) {
      return callback(null, organization);
    }

    client.getOrganization(href, function (err, organization) {
      if (err) {
        return callback(err);
      }

      setCachedOrganization(organization, cacheTtl * 1000);

      callback(null, organization);
    });
  }

  function resolveOrganizationByName(client, name, callback) {
    var organizationHref = organizationNameToHrefMap[name];

    if (organizationHref) {
      return resolveOrganizationByHref(client, organizationHref, callback);
    }

    client.getOrganizations({ nameKey: name }, function (err, collection) {
      if (err) {
        return callback(err);
      }

      var organization = collection.items[0];

      if (organization) {
        organizationNameToHrefMap[name] = organization.href;
      }

      callback(null, organization);
    });
  }

  function continueWithOrganization(organization) {
    req.organization = organization;
    next();
  }

  // Strategy which tries to resolve an organization from an access token cookie 'org' claim.
  // If this strategy fails then it falls back to resolving the organization from the request body.
  function continueWithAccessTokenStrategy() {
    if (req.cookies && req.cookies[web.accessTokenCookie.name]) {
      var accessTokenCookie = req.cookies[web.accessTokenCookie.name];

      var authenticator = new stormpath.JwtAuthenticator(application);

      authenticator.withLocalValidation();

      return authenticator.authenticate(accessTokenCookie, function (err, authResult) {
        if (err) {
          return next(err);
        }

        var verifiedJwt = authResult.expandedJwt;

        if (verifiedJwt.body.org) {
          return resolveOrganizationByHref(client, verifiedJwt.body.org, function (err, organization) {
            if (err) {
              return next(err);
            }

            var currentHost = parseDomain(helpers.getHost(req, true));

            if (web.multiTenancy.useSubdomain && organization.nameKey !== currentHost.subdomain) {
              res.status(401);
              res.json({
                status: 401,
                message: 'Multi-tenancy useDomainName mode is enabled but organization name key does not match current subdomain.'
              });
              res.end();
              return;
            }

            continueWithOrganization(organization);
          });
        }

        next();
      });
    }

    next();
  }

  // Strategy which tries to resolve an organization from a sub domain.
  // If this step fails then it falls back to resolving an organization from an access token cookie.
  function continueWithSubDomainStrategy() {
    if (web.multiTenancy.useSubdomain) {
      var currentHost = parseDomain(helpers.getHost(req, true));

      if ((!web.domainName || web.domainName === currentHost.domain) && currentHost.subdomain) {
        return resolveOrganizationByName(client, currentHost.subdomain, function (err, organization) {
          if (err) {
            return next(err);
          }

          continueWithOrganization(organization);
        });
      }
    }

    continueWithAccessTokenStrategy();
  }

  continueWithSubDomainStrategy();
}

module.exports = defaultOrganizationResolver;