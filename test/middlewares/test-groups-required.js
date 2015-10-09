'use strict';

var async = require('async');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var stormpath = require('../../index');

describe('groupsRequired', function() {
  var stormpathAccount;
  var stormpathAccountData = {
    givenName: uuid.v4(),
    surname: uuid.v4(),
    email: uuid.v4() + '@test.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };
  var stormpathApplication;
  var stormpathClient;

  before(function(done) {
    stormpathClient = helpers.createClient();
    helpers.createApplication(stormpathClient, function(err, application) {
      if (err) {
        return done(err);
      }

      stormpathApplication = application;
      application.createAccount(stormpathAccountData, function(err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;
        done();
      });
    });
  });

  after(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should redirect unauthenticated users to the login url', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.get('/private', stormpath.groupsRequired(['admins']), function(req, res) {
      res.send('Ok!');
    });

    app.on('stormpath.ready', function() {
      request(app)
        .get('/private')
        .expect(302)
        .expect('Location', app.get('stormpathConfig').web.login.uri + '?next=' + encodeURIComponent('/private'))
        .end(done);
    });
  });

  it('should show an unauthorized page to authenticated users who do not meet group criteria', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.get('/private', stormpath.groupsRequired(['admins']), function(req, res) {
      res.send('Ok!');
    });

    app.on('stormpath.ready', function() {
      var agent = request.agent(app);

      agent
        .post('/login')
        .send({
          login: stormpathAccountData.email,
          password: stormpathAccountData.password
        })
        .expect(302)
        .expect('Location', '/')
        .end(function() {
          agent
            .get('/private')
            .expect(200)
            .end(done);
        });
    });
  });

  it('should show allow users through who pass group assertion checks', function(done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        login: {
          enabled: true
        }
      }
    });

    app.get('/private', stormpath.groupsRequired(['admins', 'developers'], false), function(req, res) {
      res.send('Ok!');
    });

    app.on('stormpath.ready', function() {
      var developersGroup = null;
      var agent = request.agent(app);

      async.series([
        function(callback) {
          app.get('stormpathApplication').createGroup({ name: 'admins' }, function(err) {
            if (err) {
              return callback(err);
            }

            callback();
          });
        },
        function(callback) {
          app.get('stormpathApplication').createGroup({ name: 'developers' }, function(err, group) {
            if (err) {
              return callback(err);
            }

            developersGroup = group;
            callback();
          });
        },
        function(callback) {
          stormpathAccount.addToGroup(developersGroup, function(err) {
            callback(err);
          });
        }
      ], function(err) {
        if (err) {
          return done(err);
        }

        agent
          .post('/login')
          .send({
            login: stormpathAccountData.email,
            password: stormpathAccountData.password
          })
          .expect(302)
          .expect('Location', '/')
          .end(function() {
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
