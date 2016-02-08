'use strict';

var _ = require('lodash');
var url = require('url');

var helpers = require('../helpers');
var forms = require('../forms');
var common = require('./common');

/**
 * Takes an error object and responds either by
 * rendering the login form with the error, or
 * by returning the error as JSON.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {Object} err - The error to handle.
 */
function oauthErrorResponder(req, res, err) {
  var accepts = req.accepts(['html', 'json']);
  var config = req.app.get('stormpathConfig');

  function renderLoginFormWithError(err) {
    var view = config.web.login.view;
    var nextUri = url.parse(req.query.next || '').path;
    var encodedNextUri = encodeURIComponent(nextUri);
    var formActionUri = config.web.login.uri + (nextUri ? ('?next=' + encodedNextUri) : '');
    var oauthStateToken = common.resolveStateToken(req, res);

    var hasSocialProviders = _.some(config.socialProviders, function (socialProvider) {
      return socialProvider.enabled;
    });

    // Stormpath is unable to create or update the account because the
    // Facebook or Google response did not contain the required property.
    if (err.code === 7201) {
      err.userMessage = 'We were unable to log you in because we couldn\'t find your email address. Please make sure you give us access to read your email address.';
    }

    var options = {
      form: forms.loginForm,
      formActionUri: formActionUri,
      oauthStateToken: oauthStateToken,
      hasSocialProviders: hasSocialProviders,
      error: err.userMessage || err.message
    };

    helpers.render(req, res, view, options);
  }

  if (accepts === 'json') {
    return res.status(err.status || 400).json(err);
  }

  return renderLoginFormWithError(err);
}

module.exports = oauthErrorResponder;
