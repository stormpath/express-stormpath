'use strict';

var extend = require('deep-extend');
var resolveStateToken = require('../oauth/common').resolveStateToken;
var url = require('url');

var forms = require('../forms');
var getFormViewModel = require('./get-form-view-model');
var writeJsonError = require('./write-json-error');
var render = require('./render');


module.exports = function renderLoginForm(req, res, options) {

  var accountStoreParent =  req.organization || req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');

  getFormViewModel.default('login', config, accountStoreParent, function (err, viewModel) {
    if (err) {
      return writeJsonError(res, err);
    }

    if (options === undefined) {
      options = {};
    }

    options.form = options.form || forms.loginForm;

    var view = config.web.login.view;
    var nextUri = url.parse(req.query.next || '').path;
    var formActionUri = (config.web.login.uri + (nextUri ? ('?next=' + nextUri) : ''));

    var oauthStateToken = resolveStateToken(req, res);

    var supportedProviders = ['facebook', 'google', 'github', 'linkedin'];

    var socialProviders = viewModel.accountStores.reduce(function (socialProviders, accountStore) {

      var provider = accountStore.provider;

      if (!provider) {
        return socialProviders;
      }
      var providerId = accountStore.provider.providerId;
      if (supportedProviders.indexOf(providerId) > -1) {
        socialProviders[providerId] = config.web.social[providerId];
      }
      return socialProviders;
    }, {});

    var hasSocialProviders = !!Object.keys(socialProviders).length;

    extend(options, {
      formActionUri: formActionUri,
      oauthStateToken: oauthStateToken,
      hasSocialProviders: hasSocialProviders,
      formModel: viewModel.form,
      organization: req.organization,
      socialProviders: socialProviders
    });

    return render(req, res, view, options);
  });
};