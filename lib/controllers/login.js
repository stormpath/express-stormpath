'use strict';

var _ = require('lodash');
var extend = require('deep-extend');
var url = require('url');

var forms = require('../forms');
var helpers = require('../helpers');
var oauth = require('../oauth');

/**
 * This controller logs in an existing user.  If there are any errors, an
 * error page is rendered.  If the process succeeds, the user will be logged in
 * and redirected.
 *
 * @method
 *
 * @param {Object} req - The HTTP request.
 * @param {Object} res - The HTTP response.
 * @param {function} next - The next function.
 */
module.exports = function (req, res, next) {
  var config = req.app.get('stormpathConfig');

  res.locals.status = req.query.status;

  helpers.handleAcceptRequest(req, res, {
    'application/json': function () {
      switch (req.method) {
        case 'GET':
          helpers.getFormViewModel('login', config, function (err, viewModel) {
            if (err) {
              return helpers.writeJsonError(res, err);
            }

            res.json(viewModel);
          });
          break;

        case 'POST':
          if (!req.body) {
            return helpers.writeJsonError(res, new Error('Request requires that there is a body.'));
          }

          // Social login
          if (req.body.providerData) {
            return helpers.loginWithOAuthProvider(req.body, req, res);
          }

          helpers.authenticate(req.body, req, res, function (err) {
            if (err) {
              return helpers.writeJsonError(res, err);
            }

            helpers.loginResponder(req, res);
          });
          break;

        default:
          next();
      }
    },
    'text/html': function () {
      var nextUri = url.parse(req.query.next || '').path;

      if (req.user && config.web.login.enabled) {
        var nextUrl = nextUri || config.web.login.nextUri;
        return res.redirect(302, nextUrl);
      }

      helpers.render(req, res, config.web.login.view);
    }
  }, next);
};
