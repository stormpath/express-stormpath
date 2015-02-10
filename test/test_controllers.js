'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var after = require('mocha').after;
var afterEach = require('mocha').afterEach;
var async = require('async');
var before = require('mocha').before;
var beforeEach = require('mocha').beforeEach;
var cheerio = require('cheerio');
var describe = require('mocha').describe;
var express = require('express');
var it = require('mocha').it;
var request = require('supertest');
var uuid = require('uuid');

var stormpath = require('../index');
var stormpathRaw = require('stormpath');

describe('register', function() {
  var stormpathApplication;
  var stormpathClient;
  var stormpathPrefix;

  before(function() {
    console.log('does it exist?', process.env.STORMPATH_API_KEY_ID);
    var apiKey = new stormpathRaw.ApiKey(
      process.env.STORMPATH_API_KEY_ID,
      process.env.STORMPATH_API_KEY_SECRET
    );
    stormpathClient = new stormpathRaw.Client({ apiKey: apiKey });
  });

  beforeEach(function(done) {
    stormpathPrefix = uuid.v4();

    var appData = { name: stormpathPrefix };
    var opts = { createDirectory: true };

    stormpathClient.createApplication(appData, opts, function(err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      done();
    });
  });

  afterEach(function(done) {
    stormpathApplication.delete(function(err) {
      if (err) {
        return done(err);
      }

      done();
    });
  });

  it('should bind to /register by default', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      apiKeyId:     process.env.STORMPATH_API_KEY_ID,
      apiKeySecret: process.env.STORMPATH_API_KEY_SECRET,
      application:  stormpathApplication.href,
    }));

    request(app)
      .get('/register')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        var $ = cheerio.load(res.text);

        assert($('input[name=_csrf]').val());
        done();
      });
  });

  it('should bind to another URL if specified', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      apiKeyId:         process.env.STORMPATH_API_KEY_ID,
      apiKeySecret:     process.env.STORMPATH_API_KEY_SECRET,
      application:      stormpathApplication.href,
      registrationUrl:  '/newregister',
    }));

    async.series([
      function(cb) {
        request(app)
          .get('/newregister')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return cb(err);
            }

            var $ = cheerio.load(res.text);

            assert($('input[name=_csrf]').val());
            cb();
          });
      },
      function(cb) {
        request(app)
          .get('/register')
          .expect(404)
          .end(function(err, res) {
            if (err) {
              return cb(err);
            }

            cb();
          });
      }
    ], function(err) {
      if (err) {
        return done(err);
      }

      done();
    });
  });

  it('should not require givenName if requireGivenName is false', function(done) {
    var app = express();
    var agent = request.agent(app);

    app.use(stormpath.init(app, {
      apiKeyId:         process.env.STORMPATH_API_KEY_ID,
      apiKeySecret:     process.env.STORMPATH_API_KEY_SECRET,
      application:      stormpathApplication.href,
      requireGivenName: false,
    }));

    agent
      .get('/register')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        var $ = cheerio.load(res.text);
        var csrfToken = $('input[name=_csrf]').val();
        var email = uuid.v4() + '@test.com';

        setTimeout(function() {
          agent
            .post('/register')
            .type('form')
            .send({ surname: uuid.v4() })
            .send({ email: email })
            .send({ password: uuid.v4() + uuid.v4().toUpperCase() + '!' })
            .send({ _csrf: csrfToken })
            .end(function(err, res) {
              if (err) {
                return done(err);
              }

              stormpathApplication.getAccounts({ email: email }, function(err, accounts) {
                if (err) {
                  return done(err);
                }

                accounts.each(function(account, cb) {
                  if (account.email === email) {
                    return done();
                  }

                  cb();
                }, function() {
                  done(new Error('Account not created.'));
                });
              });
            });
        }, 5000);
      });
  });

  it('should not require surname if requireSurname is false', function(done) {
    var app = express();
    var agent = request.agent(app);

    app.use(stormpath.init(app, {
      apiKeyId:         process.env.STORMPATH_API_KEY_ID,
      apiKeySecret:     process.env.STORMPATH_API_KEY_SECRET,
      application:      stormpathApplication.href,
      requireSurname:   false,
    }));

    agent
      .get('/register')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        var $ = cheerio.load(res.text);
        var csrfToken = $('input[name=_csrf]').val();
        var email = uuid.v4() + '@test.com';

        setTimeout(function() {
          agent
            .post('/register')
            .type('form')
            .send({ givenName: uuid.v4() })
            .send({ email: email })
            .send({ password: uuid.v4() + uuid.v4().toUpperCase() + '!' })
            .send({ _csrf: csrfToken })
            .end(function(err, res) {
              if (err) {
                return done(err);
              }

              stormpathApplication.getAccounts({ email: email }, function(err, accounts) {
                if (err) {
                  return done(err);
                }

                accounts.each(function(account, cb) {
                  if (account.email === email) {
                    return done();
                  }

                  cb();
                }, function() {
                  done(new Error('Account not created.'));
                });
              });
            });
        }, 5000);
      });
  });
});
