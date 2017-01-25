'use strict';

var async = require('async');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var stormpath = require('../../index');

function createExpressTestApp(applicationHref, groupsToAssert, assertAll) {
  var app = helpers.createStormpathExpressApp({
    application: {
      href: applicationHref
    },
    web: {
      login: {
        enabled: true
      }
    }
  });

  app.get('/private', stormpath.groupsRequired(groupsToAssert, assertAll), function (req, res) {
    res.send('Ok!');
  });

  return app;
}

describe('groupsRequired', function () {
  var stormpathClient;
  var stormpathAccount;
  var stormpathApplication;

  var stormpathAccountData = {
    givenName: uuid.v4(),
    surname: uuid.v4(),
    email: uuid.v4() + '@test.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };

  beforeEach(function (done) {
    stormpathClient = helpers.createClient();
    helpers.createApplication(stormpathClient, function (err, application) {
      if (err) {
        return done(err);
      }

      stormpathApplication = application;
      application.createAccount(stormpathAccountData, function (err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;
        done();
      });
    });
  });

  afterEach(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  describe('when providing a application/json Accept header', function () {
    it('should give a 401 JSON response to unauthenticated users', function (done) {
      var app = createExpressTestApp(stormpathApplication.href, ['admins']);

      app.on('stormpath.ready', function () {
        request(app)
          .get('/private')
          .set('Accept', 'application/json')
          .expect(401)
          .expect('Content-Type', /json/)
          .expect(JSON.stringify({
            status: 401,
            message: 'You are not authenticated. Please log in to access this resource.'
          }))
          .end(done);
      });
    });

    it('should give a 403 forbidden for JSON response to authenticated users who do not meet group criteria', function (done) {
      var app = createExpressTestApp(stormpathApplication.href, ['admins']);

      app.on('stormpath.ready', function () {
        var agent = request.agent(app);

        agent
          .post('/login')
          .set('Accept', 'application/json')
          .type('json')
          .send({
            login: stormpathAccountData.email,
            password: stormpathAccountData.password
          })
          .expect(401)
          .expect('Content-Type', /json/)
          .end(function () {
            agent
              .get('/private')
              .set('Accept', 'application/json')
              .expect(403)
              .expect('Content-Type', /json/)
              .expect(JSON.stringify({
                status: 403,
                message: 'You do not have sufficient permissions to access this resource.'
              }))
              .end(done);
          });
      });
    });

    it('should forward authorized calls to the next middleware', function (done) {
      var app = createExpressTestApp(stormpathApplication.href, ['admins', 'developers'], false);

      app.on('stormpath.ready', function () {
        var developersGroup = null;
        var agent = request.agent(app);

        async.series([
          function (callback) {
            app.get('stormpathApplication').createGroup({ name: 'admins' }, function (err) {
              if (err) {
                return callback(err);
              }

              callback();
            });
          },
          function (callback) {
            app.get('stormpathApplication').createGroup({ name: 'developers' }, function (err, group) {
              if (err) {
                return callback(err);
              }

              developersGroup = group;
              callback();
            });
          },
          function (callback) {
            stormpathAccount.addToGroup(developersGroup, function (err) {
              callback(err);
            });
          }
        ], function (err) {
          if (err) {
            return done(err);
          }

          agent
            .post('/login')
            .set('Accept', 'application/json')
            .type('json')
            .send({
              login: stormpathAccountData.email,
              password: stormpathAccountData.password
            })
            .expect(200)
            .end(function () {
              agent
                .get('/private')
                .set('Accept', 'application/json')
                .expect(200)
                .expect('Ok!')
                .end(done);
            });
        });
      });
    });
  });

  describe('when providing a text/html Accept header', function () {
    it('should redirect unauthenticated users to the login url', function (done) {
      var app = createExpressTestApp(stormpathApplication.href, ['admins']);

      app.on('stormpath.ready', function () {
        request(app)
          .get('/private')
          .set('Accept', 'text/html')
          .expect(302)
          .expect('Location', app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent('/private'))
          .end(done);
      });
    });

    it('should show an unauthorized page to authenticated users who do not meet group criteria', function (done) {
      var app = createExpressTestApp(stormpathApplication.href, ['admins']);

      app.on('stormpath.ready', function () {
        var agent = request.agent(app);

        agent
          .post('/login')
          .set('Accept', 'application/json')
          .type('json')
          .send({
            login: stormpathAccountData.email,
            password: stormpathAccountData.password
          })
          .expect(200)
          .end(function () {
            agent
              .get('/private')
              .expect(403)
              .end(done);
          });
      });
    });

    it('should show allow users through who pass any group assertion checks', function (done) {
      var app = createExpressTestApp(stormpathApplication.href, ['admins', 'developers'], false);

      app.on('stormpath.ready', function () {
        var developersGroup = null;
        var agent = request.agent(app);

        async.series([
          function (callback) {
            app.get('stormpathApplication').createGroup({ name: 'admins' }, function (err) {
              if (err) {
                return callback(err);
              }

              callback();
            });
          },
          function (callback) {
            app.get('stormpathApplication').createGroup({ name: 'developers' }, function (err, group) {
              if (err) {
                return callback(err);
              }

              developersGroup = group;
              callback();
            });
          },
          function (callback) {
            stormpathAccount.addToGroup(developersGroup, function (err) {
              callback(err);
            });
          }
        ], function (err) {
          if (err) {
            return done(err);
          }

          agent
            .post('/login')
            .set('Accept', 'application/json')
            .type('json')
            .send({
              login: stormpathAccountData.email,
              password: stormpathAccountData.password
            })
            .expect(200)
            .end(function () {
              agent
                .get('/private')
                .expect(200)
                .expect('Ok!')
                .end(done);
            });
        });
      });
    });

    it('should show allow users through who pass all group assertion checks', function (done) {
      var app = createExpressTestApp(stormpathApplication.href, ['groupA', 'groupB']);

      app.on('stormpath.ready', function () {
        var testGroupA = null;
        var testGroupB = null;
        var agent = request.agent(app);

        async.series([
          function (callback) {
            app.get('stormpathApplication').createGroup({ name: 'groupA' }, function (err, group) {
              if (err) {
                return callback(err);
              }

              testGroupA = group;
              callback();
            });
          },
          function (callback) {
            app.get('stormpathApplication').createGroup({ name: 'groupB' }, function (err, group) {
              if (err) {
                return callback(err);
              }

              testGroupB = group;
              callback();
            });
          },
          function (callback) {
            stormpathAccount.addToGroup(testGroupA, function (err) {
              callback(err);
            });
          },
          function (callback) {
            stormpathAccount.addToGroup(testGroupB, function (err) {
              callback(err);
            });
          }
        ], function (err) {
          if (err) {
            return done(err);
          }

          agent
            .post('/login')
            .set('Accept', 'application/json')
            .type('json')
            .send({
              login: stormpathAccountData.email,
              password: stormpathAccountData.password
            })
            .expect(200)
            .end(function () {
              agent
                .get('/private')
                .expect(200)
                .expect('Ok!')
                .end(done);
            });
        });
      });
    });
  });

  describe('when not providing an Accept header', function () {
    it('should redirect unauthenticated users to the login url', function (done) {
      var app = createExpressTestApp(stormpathApplication.href, ['admins']);

      app.on('stormpath.ready', function () {
        request(app)
          .get('/private')
          .expect(302)
          .expect('Location', app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent('/private'))
          .end(done);
      });
    });
  });
});
