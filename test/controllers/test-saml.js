'use strict';

var assert = require('assert');
var cheerio = require('cheerio');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

function isSamlRedirect(res) {
  var location = res && res.headers && res.headers.location;
  var error = new Error('Expected Location header with redirect to saml/sso, but got ' + location);

  if (location) {
    var match = location.match(/\/saml\/sso\/idpRedirect/);
    return match ? null : error;
  }

  return error;
}

function prepareSaml(app, callbackUri, cb) {
  if (app.authorizedCallbackUris.indexOf(callbackUri) === -1) {
    app.authorizedCallbackUris.push(callbackUri);
  }

  app.save(cb);
}

function revertSaml(app, callbackUri, cb) {
  var index = app.authorizedCallbackUris.indexOf(callbackUri);

  if (index !== -1) {
    app.authorizedCallbackUris.splice(index, 1);
  }

  app.save(cb);
}

function initSamlApp(application, options, cb) {
  var webOpts = {
    login: {
      enabled: true
    },
    register: {
      enabled: true
    },
    saml: {
      enabled: true
    }
  };

  Object.keys(options).forEach(function (key) {
    webOpts[key] = options[key];
  });

  var app = helpers.createStormpathExpressApp({
    application: {
      href: application.href
    },
    web: webOpts
  });

  app.on('stormpath.ready', function () {
    var config = app.get('stormpathConfig');
    var server = app.listen(function () {
      var address = server.address().address === '::' ? 'http://localhost' : server.address().address;
      address = address === '0.0.0.0' ? 'http://localhost' : address;
      var host = address + ':' + server.address().port;
      var callbackUri = host + config.web.saml.verifyUri;
      prepareSaml(app.get('stormpathApplication'), callbackUri, function (err) {
        if (err) {
          return cb(err);
        }

        cb(null, {
          application: app,
          config: config,
          host: host
        });
      });
    });
  });
}

describe('saml', function () {
  var stormpathApplication, app, host, config, callbackUri;

  var accountData = {
    givenName: uuid.v4(),
    surname: uuid.v4(),
    email: uuid.v4() + '@test.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };

  before(function (done) {
    var client = helpers.createClient().on('ready', function () {
      helpers.createApplication(client, function (err, _app) {
        if (err) {
          return done(err);
        }

        stormpathApplication = _app;

        stormpathApplication.createAccount(accountData, function (err) {
          if (err) {
            return done(err);
          }

          initSamlApp(stormpathApplication, {}, function (err, data) {
            if (err) {
              return done(err);
            }

            app = data.application;
            config = data.config;
            host = data.host;

            done();
          });
        });
      });
    });
  });

  after(function (done) {
    revertSaml(app.get('stormpathApplication'), callbackUri, function () {
      helpers.destroyApplication(stormpathApplication, done);
    });
  });

  it('should contain the saml link in the login form, if saml is enabled', function (done) {
    request(host)
      .get(config.web.login.uri)
      .expect(200)
      .end(function (err, res) {
        var $ = cheerio.load(res.text);
        assert.equal($('.social-area').length, 1);
        assert.equal($('.btn-saml').length, 1);

        done(err);
      });
  });

  it('should perform a redirect in the SAML verification flow', function (done) {
    request(host)
      .get(config.web.saml.uri)
      .expect(302)
      .expect(isSamlRedirect)
      .end(done);
  });
});
