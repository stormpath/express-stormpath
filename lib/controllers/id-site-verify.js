'use strict';

var url = require('url');
var stormpath = require('stormpath');

var helpers = require('../helpers');

/**
 * This controller handles a Stormpath ID Site authentication.  Once a user is
 * authenticated, they'll be returned to the site.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  var params = req.query || {};
  var stormpathToken = params.jwtResponse || '';
  var nextUri = url.parse(params.next || '').path || config.web.idSite.nextUri;

  var assertionAuthenticator = new stormpath.StormpathAssertionAuthenticator(application);

  assertionAuthenticator.authenticate(stormpathToken, function (err) {
    if (err) {
      logger.info('During an IdSite login attempt, we were unable to verify the JWT response.');
      return res.status(err.status || 400).json(err);
    }

    var stormpathTokenAuthenticator = new stormpath.OAuthStormpathTokenAuthenticator(application);

    stormpathTokenAuthenticator.authenticate({ stormpath_token: stormpathToken }, function (err, authenticationResult) {
      if (err) {
        logger.info('During an IdSite login attempt, we were unable to create a Stormpath session.');
        return res.status(err.status || 400).json(err);
      }

      helpers.createSession(authenticationResult, authenticationResult.account, req, res);

      res.redirect(302, nextUri);
    });
  });
};