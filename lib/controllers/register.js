'use strict';

var async = require('async');
var stormpath = require('stormpath');
var url = require('url');
var uuid = require('uuid');

var helpers = require('../helpers');

/**
 * Delivers the default response for registration attempts that accept an HTML
 * content type, where the new account is in an unverified state. In this
 * situation we redirect to the login page with a query parameter that
 * indidcates that the account is unverified
 *
 * @function
 *
 * @param {Object} config - The express-stormpath configuration object
 * @param {Object} res - The http response.
 */
function defaultUnverifiedHtmlResponse(config, res) {
  res.redirect(302, config.web.login.uri + '?status=unverified');
}

/**
 * Delivers the default response for registration attempts that accept an HTML
 * content type, where the new account is in a verified state. In this
 * situation we redirect to the login page with a query parameter that
 * indidcates that the account has been created (and is ready for a login
 * attempt)
 *
 * @function
 *
 * @param {Object} config - The express-stormpath configuration object
 * @param {Object} res - The http response.
 */
function defaultCreatedHtmlResponse(config, res) {
  res.redirect(302, config.web.login.uri + '?status=created');
}

/**
 * Delivers the default response for registration attempts that accept an HTML
 * content type, where the new account is in a verified state and the config
 * has requested that we automatically log in the user. In this situation we
 * redirect to the next URI that is in the url, or the nextUri that is defined
 * on the registration configuration
 *
 * @function
 *
 * @param {Object} config - The express-stormpath configuration object
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
function defaultAutoAuthorizeHtmlResponse(config, req, res) {
  res.redirect(302, url.parse(req.query.next || '').path || config.web.register.nextUri);
}

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
  res.json(req.user);
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
  var registerFields = stormpathConfig.web.register.fields;

  if (!registerFields.givenName || !registerFields.givenName.required || !registerFields.givenName.enabled && !req.body.givenName) {
    req.body.givenName = 'UNKNOWN';
  }

  if (!registerFields.surname || !registerFields.surname.required || !registerFields.surname.enabled && !req.body.surname) {
    req.body.surname = 'UNKNOWN';
  }
}
/**
 * Use this method to render JSON error responses, for errors that arise from
 * the underlying Node SDK
 *
 * @function
 *
 * @param {Object} err - The error from the Node SDK
 * @param {Object} res - The http response
 */
function defaultJsonErrorResponder(err, res) {
  return res.status(err.status || 500).json({
    error: err.userMessage || err.message || 'Unexpected error in registration handler'
  });
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
  var authenticator = new stormpath.OAuthPasswordGrantRequestAuthenticator(application);
  var config = req.app.get('stormpathConfig');
  var formModel = helpers.getFormModel(config);
  var logger = req.app.get('stormpathLogger');
  var postRegistrationHandler = config.postRegistrationHandler;
  var view = config.web.register.view;

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      switch (req.method) {
        case 'GET':
          helpers.getFormViewModel('register', config, function (err, viewModel) {
            if (err) {
              return res.status(400).json({ error: err.userMessage || err.message });
            }

            res.status(200).json(viewModel);
          });
          break;

        case 'POST':
          applyDefaultAccountFields(config, req);

          helpers.validateAccount(req.body, config, function (errors) {
            if (errors) {
              return res.status(400).json({ error: errors[0].message });
            }

            helpers.prepAccountData(req.body, config, function (accountData) {
              application.createAccount(accountData, function (err, account) {
                if (err) {
                  return defaultJsonErrorResponder(err, res);
                }

                helpers.expandAccount(req.app, account, function (err, expandedAccount) {
                  req.user = expandedAccount;

                  if (config.web.register.autoLogin) {
                    return authenticator.authenticate({
                      username: req.body.email || uuid(),
                      password: req.body.password || uuid()
                    }, function (err, passwordGrantAuthenticationResult) {
                      if (err) {
                        return defaultJsonErrorResponder(err, res);
                      }

                      helpers.createSession(passwordGrantAuthenticationResult, expandedAccount, req, res);

                      if (postRegistrationHandler) {
                        return postRegistrationHandler(expandedAccount, req, res, defaultJsonResponse.bind(null, req, res));
                      }

                      defaultJsonResponse(req, res);
                    });
                  }

                  if (postRegistrationHandler) {
                    return postRegistrationHandler(expandedAccount, req, res, defaultJsonResponse.bind(null, req, res));
                  }

                  defaultJsonResponse(req, res);
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
      switch (req.method) {
        // We should render the registration template.
        case 'GET':
          helpers.render(req, res, view, {
            form: helpers.sanitizeFormData(req.body, config),
            formModel: formModel
          });
          break;

        // The user is submitting a registration request, so we should attempt
        // to validate the user's data and create their account.
        case 'POST':
          async.waterfall([
            // What we'll do here is simply set default values for `givenName` and
            // `surname`, because these value are annoying to set if you don't
            // care about them.  Eventually Stormpath is going to remove these
            // required fields, but for now this is a decent workaround to ensure
            // people don't have to deal with that stuff.
            function (callback) {
              applyDefaultAccountFields(config, req);
              callback();
            },
            function (callback) {
              helpers.validateAccount(req.body, req.app.get('stormpathConfig'), function (errors) {
                if (errors) {
                  logger.info(errors);
                  return helpers.render(req, res, view, {
                    errors: errors,
                    form: helpers.sanitizeFormData(req.body, config),
                    formModel: formModel
                  });
                }

                callback();
              });
            },
            function (callback) {
              helpers.prepAccountData(req.body, config, function (accountData) {
                application.createAccount(accountData, function (err, account) {
                  if (err) {
                    logger.info('A user tried to create a new account, but this operation failed with an error message: ' + err.developerMessage);
                    callback(err);
                  } else {
                    res.locals.user = account;
                    req.user = account;
                    callback(null, account);
                  }
                });
              });
            }
          ], function (err, account) {
            if (err) {
              logger.info(err);
              return helpers.render(req, res, view, {
                errors: [new Error(err.userMessage)],
                form: helpers.sanitizeFormData(req.body, config),
                formModel: formModel
              });
            }

            // If the account is unverified, we'll show a special message to the
            // user on the login page.
            helpers.expandAccount(req.app, account, function (err, expandedAccount) {
              req.user = expandedAccount;

              if (expandedAccount.status === 'UNVERIFIED') {

                if (postRegistrationHandler) {
                  return postRegistrationHandler(expandedAccount, req, res, defaultUnverifiedHtmlResponse.bind(null, config, res));
                }

                return defaultUnverifiedHtmlResponse(config, res);
              }

              if (config.web.register.autoLogin) {
                return authenticator.authenticate({
                  username: req.body.email || uuid(),
                  password: req.body.password || uuid()
                }, function (err, passwordGrantAuthenticationResult) {
                  if (err) {
                    return res.status(400).json({ errors: [new Error(err.userMessage || err.message)] });
                  }

                  helpers.createSession(passwordGrantAuthenticationResult, expandedAccount, req, res);

                  if (postRegistrationHandler) {
                    return postRegistrationHandler(expandedAccount, req, res, defaultAutoAuthorizeHtmlResponse.bind(null, config, req, res));
                  }

                  defaultAutoAuthorizeHtmlResponse(config, req, res);
                });
              }

              if (postRegistrationHandler) {
                return postRegistrationHandler(expandedAccount, req, res, function () {
                  return defaultCreatedHtmlResponse(config, res);
                });
              }

              return defaultCreatedHtmlResponse(config, res);
            });
          });
          break;

        default:
          next();
      }
    }
  }, next);
};
