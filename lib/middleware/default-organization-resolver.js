'use strict';

var stormpath = require('stormpath');
var parseDomain = require('psl').parse;
var helpers = require('../helpers/');

var organizationNameKeyToHrefMap = {};

function defaultOrganizationResolver(req, res, next) {
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var application = req.app.get('stormpathApplication');
  var web = config.web;

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
          return resolveOrganizationByHref(verifiedJwt.body.org, function (err, organization) {
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
    if (web.multiTenancy.strategy === 'subdomain') {
      var currentHost = parseDomain(helpers.getHost(req, true));

      if ((!web.domainName || web.domainName === currentHost.domain) && currentHost.subdomain) {
        return resolveOrganizationByNameKey(currentHost.subdomain, function (err, organization) {
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
