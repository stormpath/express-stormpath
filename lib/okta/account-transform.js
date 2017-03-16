'use strict';

/**
 * A map of Okta User statuses to Stormpath Account statuses.
 * @type {Object}
 */
var statusMap = {
  'ACTIVE': 'ENABLED',
  'DEPROVISIONED': 'DISABLED',
  'LOCKED_OUT': 'DISABLED',
  'PASSWORD_EXPIRED': 'DISABLED',
  'PROVISIONED': 'UNVERIFIED',
  'RECOVERY': 'ACTIVE',
  'STAGED': 'UNVERIFIED',
  'SUSPENDED': 'DISABLED'
};


/**
 * A map of Okta User statuses to Stormpath Account email verification statuses.
 * @type {Object}
 */
var emailVerificationStatusMap = {
  'ACTIVE': 'VERIFIED',
  'DEPROVISIONED': 'UNKNOWN',
  'LOCKED_OUT': 'VERIFIED',
  'PASSWORD_EXPIRED': 'VERIFIED',
  'PROVISIONED': 'UNVERIFIED',
  'RECOVERY': 'VERIFIED',
  'STAGED': 'UNVERIFIED',
  'SUSPENDED': 'VERIFIED'
};

/**
 * A map of Okta User Profile properties that can be mapped onto core Stormpath
 * Account properties
 * @type {Object}
 */
var oktaProfileMap = {
  login: 'username',
  email: 'email',
  firstName: 'givenName',
  middleName: 'middleName',
  lastName: 'surname'
};

// var oktaPropertyMap = {
//   id: 'href'
//   username                    | profile.login
//   email                       | profile.email
//   password                    | credentials.password.value
//   givenName                   | profile.firstName
//   middleName                  | profile.middleName
//   surname                     | profile.lastName
//   fullName                    | profile.firstName profile.lastName
//   status                      | <enum conversion of `status`>
//   createdAt                   | created
//   modifiedAt                  | lastUpdated
//   emailVerificationStatus     | <? possibly tied to status>
//   emailVerificationToken      | <not supported>
//   passwordModifiedAt          | passwordChanged
//   customData                  | <`profile` mapped stripped of known fields>
// }

/**
 * Converts an Okta user schema to a Stormpath account schema.  This is a best-effort
 * attempt and may not fit all use cases.  Use this as a potential solution to unblock
 * your migration efforts, but we recommend refactoring your code to work against
 * the Okta user schema.
 *
 * @return {Account} Stormpath account.
 */
function accountTransform(oktaUser) {

  var userProfile = oktaUser.profile;

  var account = {
    href: oktaUser._links.self.href,
    fullName: userProfile.firstName + ' ' + userProfile.lastName,
    status: statusMap[oktaUser.status] ? statusMap[oktaUser.status] : 'UNKNOWN',
    createdAt: oktaUser.created,
    modifiedAt: oktaUser.lastUpdated,
    passwordModifiedAt: oktaUser.passwordChanged,
    emailVerificationStatus: emailVerificationStatusMap[oktaUser.status] ? emailVerificationStatusMap[oktaUser.status] : 'UNKNOWN',
    customData: {}
  };

  return Object.keys(oktaUser.profile).reduce(function (account, key) {
    if (oktaProfileMap[key]) {
      account[oktaProfileMap[key]] = oktaUser.profile[key];
    } else {
      account.customData[key] = oktaUser.profile[key];
    }
    return account;
  }, account);
}

module.exports = accountTransform;
