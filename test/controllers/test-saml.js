'use strict';

var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

function isSamlRedirect(res) {
  var location = res && res.headers && res.headers.location;
  var error = new Error('Expected Location header with redirect to api.stormpath.com/sso, but got ' + location);

  if (location) {
    var match =  location.match(/api.stormpath.com\/sso/);
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
      href: app.href
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

        cb({
          application: app,
          config: config,
          host: host
        });
      });
    });
  });
}

describe('saml', function () {
  describe('traditional website', function () {
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

    it('should redirect to idsite for login, if idsite is enabled', function (done) {
      request(host).get(config.web.login.uri)
        .expect(302)
        .expect(isSamlRedirect)
        .end(function (err, res) {
          request(res.headers.location)
            .get('')
            .expect('Location', new RegExp(/\/?jwt=/))
            .end(done);
        });
    });
  });

  describe('spa', function () {
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

    it('should redirect to idsite for login, if idsite is enabled', function (done) {
      request(host).get(config.web.login.uri)
        .expect(302)
        .expect(isSamlRedirect)
        .end(function (err, res) {
          request(res.headers.location)
            .get('')
            .expect('Location', new RegExp(/\/?jwt=/))
            .end(done);
        });
    });
  });
});
