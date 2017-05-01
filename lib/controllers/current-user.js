'use strict';

var expandAccount = require('../helpers').expandAccount;
var strippedAccount = require('../helpers').strippedAccount;

function getStrippedOrganization(organization) {
  return {
    href: organization.href,
    name: organization.name,
    nameKey: organization.nameKey,
    modifiedAt: organization.modifiedAt,
    createdAt: organization.createdAt
  };
}

/**
 * Send the current user as a JSON response.  The developer can opt-in to
 * expanded properties via stormpath.web.me.expand.[resource].
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
function currentUser(req, res) {
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  expandAccount(req.user, config.web.me.expand, logger, function (err, expandedAccount) {
    res.set({
      'Cache-Control': 'no-store, no-cache',
      'Pragma': 'no-cache'
    });

    // All other properties, that have not been expanded, should be removed.

    var strippedOrganization = req.organization ?
      getStrippedOrganization(req.organization) : null;

    res.json({
      organization: strippedOrganization,
      account: strippedAccount(expandedAccount, config.web.me.expand)
    });
  });
}

module.exports = currentUser;