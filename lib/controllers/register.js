'use strict';

var async = require('async');
var stormpath = require('stormpath');
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
  res.redirect(302, req.query.next || config.web.register.nextUri);
}

/**
 * Delivers the default response for registration attempts that accept a JSON
 * content type. In this situation we simply return the new account object as
 * JSON
 *
 * @function
 *
 * @param {Object} config - The express-stormpath configuration object
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
function defaultJsonResponse(req, res) {
  res.json(req.user);
}

/**
 * The Stormpath API requires the `givenName` and `surname` fields to be
 * provided, but as a convenience our framework integrations allow you to
 * omit this data and fill those fields with the string `Anonymous`
 *
 * @function
 *
 * @param {Object} config - The express-stormpath configuration object
 * @param {Object} req - The http request.
 */

function applyDefaultAccountFields(config, req) {
  if (!config.web.register.fields.givenName.enabled && !req.body.givenName) {
    req.body.givenName = 'Anonymous';
  }

  if (!config.web.register.fields.surname.enabled && !req.body.surname) {
    req.body.surname = 'Anonymous';
  }
}

/**
 * Register a new user -- either via a JSON API, or via a browser.
 *
 * @method
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
module.exports = function (req, res) {
  var accepts = req.accepts(['html', 'json']);
  var application = req.app.get('stormpathApplication');
  var authenticator = new stormpath.OAuthPasswordGrantRequestAuthenticator(application);
  var config = req.app.get('stormpathConfig');
  var logger = req.app.get('stormpathLogger');
  var postRegistrationHandler = config.postRegistrationHandler;
  var view = config.web.register.view;

  // Handle incoming POST requests from an API-like clients (something like
  // Angular / React / REST).
  if (req.method === 'POST' && accepts === 'json') {
    applyDefaultAccountFields(config, req);
    helpers.validateAccount(req.body, config, function (errors) {
      if (errors) {
        return res.status(400).json({ error: errors[0].message });
      }

      helpers.prepAccountData(req.body, config, function (accountData) {
        application.createAccount(accountData, function (err, account) {
          if (err) {
            return res.status(400).json({ error: err.userMessage || err.message });
          }
          helpers.expandAccount(req.app, account, function (err, expandedAccount) {
            req.user = expandedAccount;

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
  // Handle incoming POST requests from an browser-like clients (something like
  // chrome / firefox / etc.).
  } else if (accepts === 'html') {
    if (config.web.spaRoot) {
      return res.sendFile(config.web.spaRoot);
    }

    // If we get here, it means the user is doing a simple GET request, so we
    // should just render the registration template.
    if (req.method === 'GET') {
      return helpers.render(req, res, view, { form: helpers.sanitizeFormData(req.body, config) });
    }

    // If we aren't getting a POST, we should bail quickly.
    if (req.method !== 'POST') {
      return res.status(415).end();
    }

    // If we get here, it means the user is submitting a registration request, so
    // we should attempt to validate the user's data and create their account.
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
            return helpers.render(req, res, view, { errors: errors, form: helpers.sanitizeFormData(req.body, config) });
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
        return helpers.render(req, res, view, { errors: [new Error(err.userMessage)], form: helpers.sanitizeFormData(req.body, config) });
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
  } else {
    res.status(415).end();
  }
};
