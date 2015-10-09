'use strict';

var assert = require('assert');
var cheerio = require('cheerio');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

function requestResetPage(app, sptoken) {
  var config = app.get('stormpathConfig');
  return request(app)
    .get(config.web.changePassword.uri + (sptoken ? ('?sptoken=' + sptoken) : ''));
}

function assertResetFormExists(res) {
  var $ = cheerio.load(res.text);

  // Assert that the form was rendered.
  assert.equal($('input[name="password"]').length, 1);
  assert.equal($('input[name="passwordAgain"]').length, 1);
}

function assertPasswordMismatchError(res) {
  var $ = cheerio.load(res.text);

  // Assert that the error was shown.
  assert($('.alert-danger').html().match(/Passwords do not match/));
}

function assertPasswordPolicyError(res) {
  var $ = cheerio.load(res.text);

  // Assert that the error was shown.
  assert($('.alert-danger').html().match(/Account password minimum length not satisfied/));
}

function assertPasswordNotConfirmedError(res) {
  var $ = cheerio.load(res.text);

  // Assert that the error was shown.
  assert($('.alert-danger').html().match(/Password is required/));
}

describe('resetPassword', function() {
  var newPassword = uuid() + uuid().toUpperCase();
  var passwordResetToken;
  var stormpathAccount;
  var stormpathApplication;
  var stormpathClient;

  before(function(done) {
    stormpathClient = helpers.createClient();
    helpers.createApplication(stormpathClient, function(err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      app.createAccount(helpers.newUser(), function(err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;
        app.sendPasswordResetEmail({ email: account.email }, function(err, tokenResource) {
          if (err) {
            return done(err);
          }

          passwordResetToken = tokenResource.href.match(/\/([^\/]+)$/)[1];
          done();
        });
      });
    });
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  afterEach(function(done) {
    helpers.setPasswordResetStatus(stormpathApplication, 'ENABLED', function(err) {
      done(err);
    });
  });

  it('should disable password reset functionality if the directory has it disabled', function(done) {
    helpers.setPasswordResetStatus(stormpathApplication, 'DISABLED', function(err) {
      if (err) {
        return done(err);
      }

      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        }
      });

      app.on('stormpath.ready', function() {
        requestResetPage(app)
          .expect(404)
          .end(done);
      });
    });
  });

  it('should redirect to the /forgot view is no sptoken is given', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        changePassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      requestResetPage(app)
        .expect(302)
        .expect('Location', config.web.forgotPassword.uri)
        .end(done);
    });
  });

  it('should redirect to the /forgot view is the sptoken is invalid, with an invlaid token status', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        resetPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      requestResetPage(app, 'invalid token')
        .expect(302)
        .expect('Location', config.web.forgotPassword.uri + '?status=invalid_sptoken')
        .end(done);
    });
  });

  it('should render the password reset form if the token is valid', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        resetPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      requestResetPage(app, passwordResetToken)
        .expect(200)
        .end(function(err, res) {
          assertResetFormExists(res);
          done();
        });
    });
  });

  it('should error if the passwords do not match', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        resetPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.changePassword.uri)
        .type('form')
        .send({
          password: 'a',
          passwordAgain: 'b',
          sptoken: passwordResetToken
        })
        .expect(200)
        .end(function(err, res) {
          assertPasswordMismatchError(res);
          done();
        });
    });
  });

  it('should error if the password is too short (does not meet policy requirements)', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        resetPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.changePassword.uri)
        .type('form')
        .send({
          password: 'a',
          passwordAgain: 'a',
          sptoken: passwordResetToken
        })
        .expect(200)
        .end(function(err, res) {
          assertPasswordPolicyError(res);
          done();
        });
    });
  });

  it('should error if the the password is not entered twice', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        resetPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.changePassword.uri)
        .type('form')
        .send({
          password: 'a',
          sptoken: passwordResetToken
        })
        .expect(200)
        .end(function(err, res) {
          assertPasswordNotConfirmedError(res);
          done();
        });
    });
  });

  it('should allow me to change the password, with a valid token, and send me to the login page', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        resetPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.changePassword.uri)
        .type('form')
        .send({
          password: newPassword,
          passwordAgain: newPassword,
          sptoken: passwordResetToken
        })
        .expect(302)
        .expect('Location', config.web.login.uri + '?status=reset')
        .end(function() {
          // Assert that the password can be used to login.
          stormpathApplication.authenticateAccount({
            username: stormpathAccount.username,
            password: newPassword
          }, function(err) {
            assert.ifError(err);
            done();
          });
        });
    });
  });

  it('should send me to the request-new-link page if i use and already consumed token', function(done) {
    // The token was consumed by the previous test, above.
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        resetPassword: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function() {
      var config = app.get('stormpathConfig');
      request(app)
        .post(config.web.changePassword.uri)
        .type('form')
        .send({ sptoken: passwordResetToken })
        .expect(302)
        .expect('Location', config.web.forgotPassword.uri + '?status=invalid_sptoken')
        .end(done);
    });
  });

  it.skip('should disable the password reset functionality if that is disabled in the directory configuration');
});
