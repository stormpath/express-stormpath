'use strict';

var assert = require('assert');
var cheerio = require('cheerio');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var SpaRootFixture = require('../fixtures/spa-root-fixture');

function requestVerifyPage(app, sptoken) {
  var config = app.get('stormpathConfig');
  return request(app)
    .get(config.web.verifyEmail.uri + (sptoken ? ('?sptoken=' + sptoken) : ''))
    .set('Accept', 'text/html');
}

function assertVerifyFormExists(res) {
  var $ = cheerio.load(res.text);
  // Assert that the form was rendered.
  assert.equal($('input[name="email"]').length, 1);
}

function assertSpTokenWarning(res) {
  var $ = cheerio.load(res.text);
  // Assert that the form was rendered.
  assert.equal($('.invalid-sp-token-warning').length, 1);
}

function assertInvalidEmailError(res) {
  var $ = cheerio.load(res.text);
  // Assert that the error was shown
  assert($('.alert-danger').html().match(/Please enter a valid email address/));
}

describe('email verification', function () {
  var expressApp;
  var stormpathApplication;

  before(function (done) {

    helpers.createApplication(helpers.createClient(), function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;

      helpers.setEmailVerificationStatus(stormpathApplication, 'ENABLED', function (err) {
        if (err) {
          return done(err);
        }
        expressApp = helpers.createStormpathExpressApp({
          application: stormpathApplication,
          web: {
            register: {
              enabled: true
            }
          }
        });
        expressApp.on('stormpath.ready', done);
      });
    });

  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should show an "unverified" message after registration', function (done) {
    var config = expressApp.get('stormpathConfig');
    request(expressApp)
      .post('/register')
      .set('Accept', 'text/html')
      .type('form')
      .send(helpers.newUser())
      .expect(302)
      .expect('Location', config.web.login.uri + '?status=unverified')
      .end(done);

  });

  it('should allow me to re-send an email verification message and show the success on the login page', function (done) {

    var config = expressApp.get('stormpathConfig');
    request(expressApp)
      .post(config.web.verifyEmail.uri)
      .set('Accept', 'text/html')
      .type('form')
      .send({ email: helpers.newUser().email })
      .expect(302)
      .expect('Location', config.web.login.uri + '?status=unverified')
      .end(done);

  });

  describe('If I ask for a new email verificaion token', function () {
    describe('and I submit an invalid email address', function () {
      describe('the HTML response', function () {
        it('should show me an error meesage', function (done) {
          var config = expressApp.get('stormpathConfig');
          request(expressApp)
            .post(config.web.verifyEmail.uri)
            .set('Accept', 'text/html')
            .type('form')
            .send({ email: uuid() })
            .expect(200)
            .end(function (err, res) {
              assertInvalidEmailError(res);
              done();
            });
        });
      });
      describe('the JSON response', function () {
        it('should send me an error object', function (done) {
          var config = expressApp.get('stormpathConfig');
          request(expressApp)
            .post(config.web.verifyEmail.uri)
            .set('Accept', 'text/html')
            .send({ login: uuid() })
            .set('Accept', 'application/json')
            .expect(200, '', done);
        });
      });
    });
    describe('and I omit the email address field property', function () {

      describe('the JSON response', function () {
        it('should send me an error object', function (done) {
          var config = expressApp.get('stormpathConfig');
          request(expressApp)
            .post(config.web.verifyEmail.uri)
            .set('Accept', 'text/html')
            .set('Accept', 'application/json')
            .expect(400, '{"status":400,"message":"login property cannot be null, empty, or blank."}', done);
        });
      });
    });
  });

  it('should show a form at /verify for re-sending the verification email', function (done) {

    requestVerifyPage(expressApp)
      .expect(200)
      .end(function (err, res) {
        assertVerifyFormExists(res);
        done();
      });

  });

  describe('if given an invalid token', function () {

    it('should show a warning message as HTML', function (done) {
      requestVerifyPage(expressApp, 'invalidtoken')
        .expect(200)
        .end(function (err, res) {
          assertSpTokenWarning(res);
          done();
        });
    });

    it('should respond with an error message as JSON', function (done) {
      var config = expressApp.get('stormpathConfig');
      request(expressApp)
        .get(config.web.verifyEmail.uri + '?sptoken=invalidtoken')
        .set('Accept', 'application/json')
        .expect(404, '{"status":404,"message":"The requested resource does not exist."}', done);
    });

  });

  it('should redirect me to the login page with a verified message if my sptoken is valid', function (done) {


    var application = expressApp.get('stormpathApplication');
    var client = expressApp.get('stormpathClient');
    var config = expressApp.get('stormpathConfig');

    application.createAccount(helpers.newUser(), function (err, account) {
      if (err) {
        return done(err);
      }

      application.resendVerificationEmail({ login: account.email }, function (err) {
        if (err) {
          return done(err);
        }

        client.getAccount(account.href, function (err, account) {
          if (err) {
            return done(err);
          }

          var token = account.emailVerificationToken.href.match(/\/([^\/]+)$/)[1];
          requestVerifyPage(expressApp, token)
            .expect(302)
            .expect('Location', config.web.login.uri + '?status=verified')
            .end(done);
        });
      });
    });

  });

  it('should be able to serve the form at a different uri', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web:{
        verifyEmail:{
          uri: '/' + uuid()
        }
      }
    });

    app.on('stormpath.ready', function () {
      requestVerifyPage(app)
        .expect(200)
        .end(function (err, res) {
          assertVerifyFormExists(res);
          done();
        });
    });
  });

  describe('if configured with a SPA root', function () {

    var spaRootFixture;

    before(function (done) {
      spaRootFixture = new SpaRootFixture({
        application: {
          href: stormpathApplication.href
        }
      });
      spaRootFixture.before(done);
    });

    after(function (done) {
      spaRootFixture.after(done);
    });


    it('should return the SPA root', function (done) {

      var app = spaRootFixture.expressApp;

      app.on('stormpath.ready', function () {
        var config = app.get('stormpathConfig');
        request(app)
          .get(config.web.verifyEmail.uri)
          .set('Accept', 'text/html')
          .expect(200)
          .end(spaRootFixture.assertResponse(done));
      });

    });
  });

  // it('should show an error if the sptoken is invalid',function (){
  //   var app = express();
  //   app
  //     .use(stormpath.init(app, {
  //       application: {
  //         href: stormpathApplication.href
  //       }
  //     }))
  //     .on('stormpath.ready',function (){
  //       var config = app.get('stormpathConfig');
  //       request(app)
  //         .get(uri)
  //         .expect(200)
  //         .end(function (err,res) {

  //           var $ = cheerio.load(res.text);

  //           // Assert that the form was rendered.
  //           assert.equal($('input[name="email"]').length, 1);
  //           done();
  //         });
  //     });
  // });
});
