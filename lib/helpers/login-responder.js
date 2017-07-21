'use strict';

var url = require('url');
var strippedAccount = require('./stripped-account-response');

/**
 * If the request has the Accept header set to json, it will respond by just ending the response.
 * Else it will redirect to the configured url.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var config = req.app.get('stormpathConfig');
  var accepts = req.accepts(['html', 'json']);
  var nextUrl = url.parse(req.query.next || '').path || config.web.login.nextUri;

  if (accepts === 'json') {
    return res.json({
      account: strippedAccount(req.user)
    });
  }

  res.redirect(302, nextUrl);
};