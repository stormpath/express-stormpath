'use strict';

var helpers = require('../helpers');

/**
 * Delivers the default response for registration attempts that accept a JSON
 * content type. In this situation we simply return the new account object as
 * JSON
 *
 * @function
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
function defaultJsonResponse(req, res) {
  helpers.strippedAccountResponse(req.user, res);
}

/**
 * The Stormpath API requires the `givenName` and `surname` fields to be
 * provided, but as a convenience our framework integrations allow you to
 * omit this data and fill those fields with the string `UNKNOWN` - but only
 * if the field is not explicitly required.
 *
 * @function
 *
 * @param {Object} stormpathConfig - The express-stormpath configuration object
 * @param {Object} req - The http request.
 */
function applyDefaultAccountFields(stormpathConfig, req) {
  var registerFields = stormpathConfig.web.register.form.fields;

  if ((!registerFields.givenName || !registerFields.givenName.required || !registerFields.givenName.enabled) && !req.body.givenName) {
    req.body.givenName = 'UNKNOWN';
  }

  if ((!registerFields.surname || !registerFields.surname.required || !registerFields.surname.enabled) && !req.body.surname) {
    req.body.surname = 'UNKNOWN';
  }
}

/**
 * Register a new user -- either via a JSON API, or via a browser.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 * @param {function} next - The next callback.
 */
module.exports = function (req, res, next) {
  var application = req.app.get('stormpathApplication');
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');

  function handlePreRegistration(formData, callback) {
    var preRegistrationHandler = config.preRegistrationHandler;

    if (preRegistrationHandler) {
      return preRegistrationHandler(formData, req, res, callback);
    }

    callback();
  }

  function handleResponse(account, responseHandler) {
    var postRegistrationHandler = config.postRegistrationHandler;

    if (postRegistrationHandler) {
      return postRegistrationHandler(account, req, res, responseHandler.bind(null, req, res));
    }

    responseHandler(req, res);
  }

  helpers.getFormViewModel('register', config, function (err, viewModel) {
    if (err) {
      return helpers.writeJsonError(res, err);
    }

    helpers.handleAcceptRequest(req, res, {
      'application/json': function () {
        switch (req.method) {
          case 'GET':
            res.status(200).json(viewModel);
            break;

          case 'POST':
            applyDefaultAccountFields(config, req);

            handlePreRegistration(req.body, function (err) {
              if (err) {
                return helpers.writeJsonError(res, err);
              }

              helpers.validateAccount(req.body, config, function (errors) {
                if (errors) {
                  return helpers.writeJsonError(res, errors[0]);
                }

                helpers.prepAccountData(req.body, config, function (accountData) {
                  application.createAccount(accountData, function (err, account) {
                    if (err) {
                      return helpers.writeJsonError(res, err);
                    }

                    if (config.web.register.autoLogin) {
                      var options = {
                        username: req.body.email,
                        password: req.body.password
                      };

                      return helpers.authenticate(options, req, res, function (err, account, authResult) {
                        if (err) {
                          return helpers.writeJsonError(res, err);
                        }

                        helpers.createSession(authResult, account, req, res);

                        handleResponse(account, defaultJsonResponse);
                      });
                    }

                    helpers.expandAccount(account, config.expand, logger, function (err, expandedAccount) {
                      if (err) {
                        return helpers.writeJsonError(res, err);
                      }

                      req.user = expandedAccount;

                      handleResponse(expandedAccount, defaultJsonResponse);
                    });
                  });
                });
              });
            });
            break;

          default:
            next();
        }
      },
      'text/html': function () {
        helpers.render(req, res, config.web.register.view);
      }
    }, next);
  });
};
