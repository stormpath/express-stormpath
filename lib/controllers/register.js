'use strict';

var async = require('async');
var url = require('url');
var uuid = require('uuid');

var Account = require('stormpath/lib/resource/Account');
var helpers = require('../helpers');
var oktaErrorTransformer = require('../okta/error-transformer');

/**
 * Delivers the default response for registration attempts that accept an HTML
 * content type, where the new account is in an unverified state. In this
 * situation we redirect to the login page with a query parameter that
 * indidcates that the account is unverified
 *
 * @function
 *
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
function defaultUnverifiedHtmlResponse(req, res) {
  var config = req.app.get('stormpathConfig');
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
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
function defaultCreatedHtmlResponse(req, res) {
  var config = req.app.get('stormpathConfig');
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
 * @param {Object} req - The http request.
 * @param {Object} res - The http response.
 */
function defaultAutoAuthorizeHtmlResponse(req, res) {
  var config = req.app.get('stormpathConfig');
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
  res.json({
    account: helpers.strippedAccount(req.user)
  });
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
  var client = req.app.get('stormpathClient');
  var config = req.app.get('stormpathConfig');
  var emailVerificationHandler = config.emailVerificationHandler;
  var logger = req.app.get('stormpathLogger');
  var view = config.web.register.view;

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

                  var oktaUser = Account.prototype.toOktaUser.call(accountData, {
                    customDataStrategy: config.customDataStrategy
                  });

                  var options = {
                    activate: true
                  };

                  oktaUser.profile.emailVerificationStatus = 'UNVERIFIED';
                  oktaUser.profile.emailVerificationToken = uuid.v4();
                  oktaUser.profile.stormpathMigrationRecoveryAnswer = uuid.v4();
                  oktaUser.credentials.recovery_question = {
                    question: 'stormpathMigrationRecoveryAnswer',
                    answer: oktaUser.profile.stormpathMigrationRecoveryAnswer
                  };

                  if (config.web.register.emailVerificationRequired) {
                    options.activate = false;
                  }

                  client.createUser(oktaUser, options, function (err, account) {

                    if (err) {
                      return helpers.writeJsonError(res, oktaErrorTransformer(err));
                    }

                    client.createResource(application.href + '/users', {
                      id: account.id,
                      scope: 'USER',
                      credentials: {
                        userName: account.email
                      }
                    }, function (err) {

                      if (err) {
                        return helpers.writeJsonError(res, err);
                      }

                      if (config.web.register.emailVerificationRequired) {
                        emailVerificationHandler(account);
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

                      req.user = account;
                      handleResponse(account, defaultJsonResponse);
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
        var writeFormError = helpers.writeFormError.bind(null, req, res, view, viewModel);
        var formActionUri = config.web.register.uri;

        return helpers.organizationResolutionGuard(req, res, formActionUri, function () {
          switch (req.method) {
            // We should render the registration template.
            case 'GET':

              if (helpers.requiresOrganizationResolution(req)) {
                return helpers.parentDomainRedirect(req, res);
              }

              helpers.render(req, res, view, {
                form: helpers.sanitizeFormData(req.body),
                formModel: viewModel.form,
                organization: req.organization
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
                  handlePreRegistration(req.body, function (err) {
                    if (err) {
                      return writeFormError(err);
                    }

                    helpers.validateAccount(req.body, config, function (errors) {
                      if (errors) {
                        return writeFormError(errors[0]);
                      }

                      callback();
                    });
                  });
                },
                function (callback) {
                  helpers.prepAccountData(req.body, config, function (accountData) {
                    if (req.organization) {
                      accountData.accountStore = {
                        href: req.organization.href
                      };
                    }

                    var oktaUser = Account.prototype.toOktaUser.call(accountData, {
                      customDataStrategy: config.customDataStrategy
                    });

                    var options = {
                      activate: true
                    };

                    oktaUser.profile.emailVerificationStatus = 'UNVERIFIED';
                    oktaUser.profile.emailVerificationToken = uuid.v4();
                    oktaUser.profile.stormpathMigrationRecoveryAnswer = uuid.v4();
                    oktaUser.credentials.recovery_question = {
                      question: 'stormpathMigrationRecoveryAnswer',
                      answer: oktaUser.profile.stormpathMigrationRecoveryAnswer
                    };

                    if (config.web.register.emailVerificationRequired) {
                      options.activate = false;
                    }

                    client.createUser(oktaUser, options, function (err, account) {


                      if (err) {
                        logger.info('A user tried to create a new account, but this operation failed with an error message: ' + err.developerMessage);
                        return callback(oktaErrorTransformer(err));
                      }

                      client.createResource(application.href + '/users', {
                        id: account.id,
                        scope: 'USER',
                        credentials: {
                          userName: account.email
                        }
                      }, function (err) {
                        if (err) {
                          return callback(err);
                        }

                        if (config.web.register.emailVerificationRequired) {
                          emailVerificationHandler(account);
                        }

                        res.locals.user = account;
                        req.user = account;
                        callback(null, account);
                      });

                    });
                  });
                }
              ], function (err, account) {
                if (err) {
                  return writeFormError(err);
                }

                if (account.status === 'UNVERIFIED') {
                  return handleResponse(account, defaultUnverifiedHtmlResponse);
                }

                if (config.web.register.autoLogin) {
                  var options = {
                    username: req.body.email,
                    password: req.body.password
                  };

                  if (req.organization) {
                    options.accountStore = req.organization.href;
                  }

                  return helpers.authenticate(options, req, res, function (err, expandedAccount, authResult) {
                    if (err) {
                      return writeFormError(err);
                    }

                    helpers.createSession(authResult, expandedAccount, req, res);

                    handleResponse(expandedAccount, defaultAutoAuthorizeHtmlResponse);
                  });
                }

                req.user = account;
                handleResponse(account, defaultCreatedHtmlResponse);

              });
              break;

            default:
              next();
          }
        });
      }
    }, next);
  });
};
