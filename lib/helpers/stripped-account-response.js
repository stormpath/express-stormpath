'use strict';

var _ = require('lodash');

/**
 * Returns an account object, but strips all of the linked resources and sensitive properties.
 *
 * @function
 *
 * @param {Object} account - The stormpath account object.
 */
function strippedAccount(account, expansionMap) {
  expansionMap = typeof expansionMap === 'object' ? expansionMap : {};

  var strippedAccount = _.clone(account);
  var hiddenProperties = ['stormpathMigrationRecoveryAnswer', 'emailVerificationToken'];

  // Profile data is copied onto custom data, so we don't need to expose profile

  if (strippedAccount.profile) {
    delete strippedAccount.profile;
  }

  delete strippedAccount.credentials;
  delete strippedAccount._links;

  Object.keys(strippedAccount).forEach(function (property) {

    var expandable = !!expansionMap[property];

    if (strippedAccount[property] && (strippedAccount[property].href || strippedAccount[property].items) && expandable === false) {
      delete strippedAccount[property];
    }

    if (property === 'customData') {
      if (expandable) {
        Object.keys(strippedAccount[property]).forEach(function (subProperty) {
          if (hiddenProperties.indexOf(subProperty) > -1) {
            delete strippedAccount[property][subProperty];
          }
          if (subProperty.match('stormpathApiKey')) {
            delete strippedAccount[property][subProperty];
          }
        });
      } else {
        delete strippedAccount.customData;
      }
    }

  });

  return strippedAccount;
}

module.exports = strippedAccount;