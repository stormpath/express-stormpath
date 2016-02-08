'use strict';

var _ = require('lodash');
var url = require('url');

var helpers = require('../helpers');
var forms = require('../forms');
var resolveStateToken = require('./common').resolveStateToken;

/**
 * oauthErrorResponder takes an error object and respondes
 * either by rendering the login form with the error, or
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
    var view = req.app.get('stormpathConfig').web.login.view;
    var nextUri = url.parse(req.query.next || '').path;
    var formActionUri = config.web.login.uri + (nextUri ? ('?next=' + nextUri) : '');
    var oauthStateToken = resolveStateToken(req, res);

    var hasSocialProviders = _.some(config.socialProviders, function (socialProvider) {
      return socialProvider.enabled;
    });

    if (err.code === 7201) {
      // Stormpath is unable to create or update the account because the
      // Facebook or Google response did not contain the required property.
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

  switch (accepts) {
    case 'json':
      return res.status(err.status || 400).json(err);

    case 'html':
    default:
      return renderLoginFormWithError(err);
  }
}

module.exports = oauthErrorResponder;
