'use strict';

var _ = require('lodash');
var url = require('url');

var render = require('../helpers/render');
var writeJsonError = require('../helpers/write-json-error');
var forms = require('../forms');
var common = require('./common');

/**
 * Takes an error object and renders the login
 * form with that error.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {Object} config - Stormpath config.
 * @param {Object} err - The error to display.
 */
function renderLoginFormWithError(req, res, config, err) {
  var logger = req.app.get('stormpathLogger');
  var view = config.web.login.view;
  var nextUri = url.parse(req.query.next || '').path;
  var encodedNextUri = encodeURIComponent(nextUri);
  var formActionUri = config.web.login.uri + (nextUri ? ('?next=' + encodedNextUri) : '');
  var oauthStateToken = common.resolveStateToken(req, res);

  var hasSocialProviders = _.some(config.web.social, function (socialProvider) {
    return socialProvider.enabled;
  });

  // Stormpath is unable to create or update the account because the
  // Facebook or Google response did not contain the required property.
  if (err.code === 7201) {
    logger.info('Provider login error: ' + err.message);
    err.userMessage = 'Login failed, because we could not retrieve your email address from the provider.  Please ensure that you have granted email permission to our application.';
  }

  var options = {
    form: forms.loginForm,
    formActionUri: formActionUri,
    oauthStateToken: oauthStateToken,
    hasSocialProviders: hasSocialProviders,
    error: err.userMessage || err.message
  };

  render(req, res, view, options);
}

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

  if (accepts === 'json') {
    return writeJsonError(res, err);
  }

  return renderLoginFormWithError(req, res, config, err);
}

module.exports = oauthErrorResponder;
