'use strict';

var Cookies = require('cookies');

var assert = require('assert');
var async = require('async');
var bodyParser = require('body-parser');
var request = require('supertest');
var uuid = require('uuid');

var getUser = require('../../lib/middleware/get-user');
var helpers = require('../helpers');
var login = require('../../lib/controllers/login');

describe.only('getUser', function () {
  var username = 'test+' + uuid.v4() + '@stormpath.com';
  var password = uuid.v4() + uuid.v4().toUpperCase();
  var accountData = {
    email: username,
    password: password,
    givenName: uuid.v4(),
    surname: uuid.v4(),
    customData: {
      favoriteColor: 'blue'
    }
  };
  var stormpathAccount;
  var stormpathApiKey;
  var stormpathApplication;
  var stormpathClient;
  var defaultExpressApp;
  var remoteValidationExpressApp;

  /**
   * This callback, when called, will continue processing the http request.
   *
   * @callback middlewareCallback
   *
   * @param {Object} req - The http request.
   * @param {Object} res - The http response.
   * @param {Function} [next] - The next middleware to run.
   */

  /**
   * This route creates a cookie, then returns a 200.  Used for testing auth in
   * a more isolated environment.
   *
   * @param {String} cookieName - The cookie name to set.
   * @param {String} cookieValue - The cookie value to set.
   * @returns {middlewareCallback} - The Express middleware which runs when
   *    used.
   */
  function createCookieRoute(cookieName, cookieValue) {
    return function (req, res) {
      var cookies = new Cookies(req, res);
      cookies.set(cookieName, cookieValue, { overwrite: true });
      res.status(200).end();
    };
  }

  before(function (done) {
    stormpathClient = helpers.createClient();
    helpers.createApplication(stormpathClient, function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      defaultExpressApp = helpers.createOktaExpressApp({
        application: stormpathApplication
      });

      remoteValidationExpressApp = helpers.createOktaExpressApp({
        application: stormpathApplication,
        web: {
          oauth2: {
            password: {
              validationStrategy: 'remote'
            }
          }
        }
      });

      function contextResponder(req, res) {
        res.json({ user: req.user, accessToken: req.accessToken, authenticationResult: req.authenticationResult });
      }

      function customDataSaverA(req, res) {
        for (var key in req.body) {
          req.user.customData[key] = req.body[key];
        }
        req.user.customData.save(function (err) {
          if (err) {
            res.status(400).json(err);
          } else {
            res.end();
          }
        });
      }

      function customDataSaverB(req, res) {
        for (var key in req.body) {
          req.user.customData[key] = req.body[key];
        }
        req.user.save(function (err) {
          if (err) {
            res.status(400).json(err);
          } else {
            res.end();
          }
        });
      }


      defaultExpressApp.get('/user', getUser, contextResponder);
      defaultExpressApp.post('/profileA', getUser, bodyParser.json(), customDataSaverA);
      defaultExpressApp.post('/profileB', getUser, bodyParser.json(), customDataSaverB);

      remoteValidationExpressApp.get('/user', getUser, contextResponder);
      remoteValidationExpressApp.post('/profileA', getUser, bodyParser.json(), customDataSaverA);
      remoteValidationExpressApp.post('/profileB', getUser, bodyParser.json(), customDataSaverB);

      app.createAccount(accountData, function (err, account) {
        if (err) {
          return done(err);
        }

        stormpathAccount = account;
        stormpathAccount.createApiKey(function (err, key) {
          if (err) {
            return done(err);
          }

          stormpathApiKey = key;
          done();
        });
      });
    });
  });

  it('should not overwrite req.user if req.user is already defined', function (done) {

    function fakeReqUser(req, res, next) {
      req.user = 'blah';
      next();
    }

    defaultExpressApp.get('/blah', fakeReqUser, getUser, function (req, res) {
      res.json({ user: req.user });
    });

    request(defaultExpressApp)
      .get('/blah')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        var json = JSON.parse(res.text);
        assert.equal(json.user, 'blah');
        done();
      });
  });

  it('should not set req.user if no cookies are present', function (done) {

    request(defaultExpressApp)
      .get('/user')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }

        var json = JSON.parse(res.text);
        assert.equal(json.user, null);
        done();
      });
  });

  it('should not set req.user if an invalid access_token cookie is present, and no refresh_token cookie is present', function (done) {
    var agent = request.agent(defaultExpressApp);

    defaultExpressApp.get('/setCookie', createCookieRoute('access_token', 'blah'));

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .get('/setCookie')
          .expect(200)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);
            assert.equal(json.user, null);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should not set req.user if a DEPROVISIONED account\'s access_token cookie is present (requires remote validation configuration)', function (done) {

    var account;
    var accountData = helpers.newUser();
    var agent = request.agent(remoteValidationExpressApp);

    async.series([
      function (next) {
        stormpathApplication.createAccount(accountData, function (err, _account) {
          if (err) {
            return next(err);
          }
          account = _account;
          next();
        });
      },
      function (next) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(next);
      },
      function (next) {
        // First call to delete() will deprovision the user
        account.delete(next);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);
            assert.equal(json.user, null);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should not set req.user if the user\'s refresh token is revoked (requires remote validation configuration)', function (done) {

    var acessToken;
    var accountData = helpers.newUser();
    var agent = request.agent(remoteValidationExpressApp);
    var config = remoteValidationExpressApp.get('stormpathClient').config;

    async.series([
      function (next) {
        stormpathApplication.createAccount(accountData, next);
      },
      function (next) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(function (err, res) {
            acessToken = (res.headers['set-cookie'] || []).join('').match(/refresh_token=([^;]+)/)[1];
            next(err);
          });
      },
      function (next) {
        request(config.org)
          .post('oauth2/' + config.authorizationServerId + '/v1/revoke')
          .set('Accept', 'application/json')
          .send('token=' + acessToken)
          .send('token_type_hint=refresh_token')
          .auth(config.authorizationServerClientId, config.authorizationServerClientSecret)
          .end(next);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);
            assert.equal(json.user, null);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should not set req.user if a DEPROVISIONED account\'s access_token cookie is invalid but who\'s refresh_token cookie is valid', function (done) {

    var account;
    var accountData = helpers.newUser();
    var agent = request.agent(remoteValidationExpressApp);

    async.series([
      function (next) {
        stormpathApplication.createAccount(accountData, function (err, _account) {
          if (err) {
            return next(err);
          }
          account = _account;
          next();
        });
      },
      function (callback) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        agent.jar.setCookie('access_token=foo');
        callback();
      },
      function (next) {
        // First call to delete() will deprovision the user
        account.delete(next);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);
            assert.equal(json.user, null);
            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should set req.user, res.locals.user, res.authenticationResult, res.accessToken if an access_token cookie is present and valid', function (done) {

    var agent = request.agent(defaultExpressApp);

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user.givenName, accountData.givenName);
            assert.equal(json.user.surname, accountData.surname);
            assert.equal(json.user.email, accountData.email);
            assert.equal(json.accessToken.body.sub, stormpathAccount.email);
            assert.equal(json.authenticationResult.expandedJwt.body.sub, stormpathAccount.email);
            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should have faster validation with local validation (default)', function (done) {

    var agentA = request.agent(defaultExpressApp);
    var agentB = request.agent(remoteValidationExpressApp);

    async.series([
      function (callback) {
        agentA
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        agentB
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        var a = new Date();
        agentA
          .get('/user')
          .accept('application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }
            var delta = new Date() - a;
            assert(delta < 20, 'Validation took ' + delta + 'ms, does not appear to be local validation');
            assert.equal(res.body.user.email, accountData.email);
            callback();
          });
      },
      function (callback) {
        var a = new Date();
        agentB
          .get('/user')
          .accept('application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }
            var b = new Date();
            assert((b - a) > 100, 'Validation was too quick, doesnt appear to be remote validation');
            assert.equal(res.body.user.email, accountData.email);
            callback();
          });
      }
    ], done);

  });

  it('should set req.user and res.locals.user if an invalid access_token cookie is present but a valid refresh_token is present', function (done) {

    var agent = request.agent(defaultExpressApp);

    defaultExpressApp.get('/setCookie', createCookieRoute('access_token', 'hiii'));

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/setCookie')
          .expect(200)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user.givenName, accountData.givenName);
            assert.equal(json.user.surname, accountData.surname);
            assert.equal(json.user.email, accountData.email);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should not set req.user if an invalid refresh_token cookie is present, and no access_token cookie is present', function (done) {

    var agent = request.agent(defaultExpressApp);

    defaultExpressApp.get('/setCookie', createCookieRoute('refresh_token', 'blah'));

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .get('/setCookie')
          .expect(200)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);
            assert.equal(json.user, null);
            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should set req.user and res.locals.user if a valid refresh_token cookie is present', function (done) {

    var agent = request.agent(defaultExpressApp);

    defaultExpressApp.get('/deleteCookie', createCookieRoute('access_token', ''));

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/deleteCookie')
          .expect(200)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);
            assert.equal(json.user.givenName, accountData.givenName);
            assert.equal(json.user.surname, accountData.surname);
            assert.equal(json.user.email, accountData.email);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should expand customData if a valid access_token cookie is present', function (done) {
    var agent = request.agent(defaultExpressApp);

    defaultExpressApp.post('/login', login);

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user.givenName, accountData.givenName);
            assert.equal(json.user.surname, accountData.surname);
            assert.equal(json.user.email, accountData.email);
            assert.equal(json.user.customData.favoriteColor, accountData.customData.favoriteColor);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should expand customData if a valid refresh_token cookie is present', function (done) {
    var agent = request.agent(defaultExpressApp);

    defaultExpressApp.get('/deleteCookie', createCookieRoute('access_token', ''));

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/deleteCookie')
          .expect(200)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user.givenName, accountData.givenName);
            assert.equal(json.user.surname, accountData.surname);
            assert.equal(json.user.email, accountData.email);
            assert.equal(json.user.customData.favoriteColor, accountData.customData.favoriteColor);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should expand customData if an invalid access_token cookie is present along with a valid refresh_token cookie', function (done) {
    var agent = request.agent(defaultExpressApp);

    defaultExpressApp.get('/deleteCookie', createCookieRoute('access_token', 'woot'));

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .post('/login')
          .send({
            login: accountData.email,
            password: accountData.password
          })
          .expect(302)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/deleteCookie')
          .expect(200)
          .end(callback);
      },
      function (callback) {
        agent
          .get('/user')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user.givenName, accountData.givenName);
            assert.equal(json.user.surname, accountData.surname);
            assert.equal(json.user.email, accountData.email);
            assert.equal(json.user.customData.favoriteColor, accountData.customData.favoriteColor);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should not set req.user if an invalid basic auth header is present', function (done) {

    var agent = request.agent(defaultExpressApp);

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .get('/user')
          .auth('invalid', 'auth')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user, null);
            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should not set req.user if an invalid bearer header is present', function (done) {

    var agent = request.agent(defaultExpressApp);

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .get('/user')
          .set('Authorization', 'Bearer: SOME_INVALID_TOKEN')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user, null);
            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it.skip('should set req.user if a valid basic auth header is present', function (done) {

    var agent = request.agent(defaultExpressApp);

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .get('/user')
          .auth(stormpathApiKey.id, stormpathApiKey.secret)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user.givenName, accountData.givenName);
            assert.equal(json.user.surname, accountData.surname);
            assert.equal(json.user.email, accountData.email);
            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it.skip('should expand customData if a valid basic auth header is present', function (done) {
    var agent = request.agent(defaultExpressApp);

    async.series([
      function (callback) {
        stormpathAccount.status = 'ENABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .get('/user')
          .auth(stormpathApiKey.id, stormpathApiKey.secret)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return callback(err);
            }

            var json = JSON.parse(res.text);

            assert.equal(json.user.givenName, accountData.givenName);
            assert.equal(json.user.surname, accountData.surname);
            assert.equal(json.user.email, accountData.email);
            assert.equal(json.user.customData.favoriteColor, accountData.customData.favoriteColor);

            callback();
          });
      }
    ], function (err) {
      done(err);
    });
  });

  it('should allow me to save custom data with req.user.customData.save()', function (done) {

    function testWithAgent(agent, next) {
      var accountData = helpers.newUser();
      async.series([
        function (next) {
          stormpathApplication.createAccount(accountData, next);
        },
        function (callback) {
          agent
            .post('/login')
            .send({
              login: accountData.email,
              password: accountData.password
            })
            .expect(302)
            .end(callback);
        },
        function (callback) {
          agent
            .post('/profileA')
            .send({
              favoriteColor: 'bar'
            })
            .expect(200)
            .end(callback);
        },
        function (callback) {
          agent
            .get('/user')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return callback(err);
              }

              var json = JSON.parse(res.text);
              assert.equal(json.user.customData.favoriteColor, 'bar');
              callback();
            });
        },
        function (callback) {
          agent
            .post('/profileB')
            .send({
              favoriteColor: 'baz'
            })
            .expect(200)
            .end(callback);
        },
        function (callback) {
          agent
            .get('/user')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return callback(err);
              }

              var json = JSON.parse(res.text);
              assert.equal(json.user.customData.favoriteColor, 'baz');
              callback();
            });
        }
      ], next);
    }
    async.parallel([
      testWithAgent.bind(null, request.agent(defaultExpressApp)),
      testWithAgent.bind(null, request.agent(remoteValidationExpressApp))
    ], done);
  });

});
