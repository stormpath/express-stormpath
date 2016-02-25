'use strict';

var expandAccount = require('../helpers').expandAccount;
/**
 * Send the current user as a JSON response.  The developer can opt-in to
 * expanded properties via stormpath.web.me.expand.[resource]
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
    res.json(expandedAccount);
  });
}

module.exports = currentUser;