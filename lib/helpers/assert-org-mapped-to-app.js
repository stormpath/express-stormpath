'use strict';

function assertOrganizationIsMappedToApplication(organization, application, cb) {
  application.getAccountStoreMappings(function (err, mappings) {
    if (err) {
      return cb(err);
    }

    mappings.some(function (mapping, next) {
      next(organization && mapping.accountStore.href === organization.href);
    }, function (hasMatch) {
      cb(null, hasMatch);
    });
  });
}

module.exports = assertOrganizationIsMappedToApplication;