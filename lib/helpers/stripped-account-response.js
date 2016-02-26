'use strict';

var _ = require('lodash');

/**
 * Respond with an account object, but strips all of the linked resources.
 *
 * @function
 *
 * @param {Object} account - The stormpath account object.
 * @param {Object} req - The http request.
 */
function strippedAccountResponse(account, res) {
  var strippedAccount = _.clone(account);
  Object.keys(strippedAccount).forEach(function (property) {
    if (strippedAccount[property] && strippedAccount[property].href) {
      delete strippedAccount[property];
    }
  });
  res.json({
    account: strippedAccount
  });
}

module.exports = strippedAccountResponse;