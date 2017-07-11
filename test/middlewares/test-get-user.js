'use strict';

var Cookies = require('cookies');

var assert = require('assert');
var async = require('async');
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

      defaultExpressApp.get('/user', getUser, function (req, res) {
        res.json({ user: req.user, accessToken: req.accessToken, authenticationResult: req.authenticationResult });
      });

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

  it.skip('should continue immediately if a disabled account\'s access_token cookie is present', function (done) {
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
        stormpathAccount.status = 'DISABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
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

  it.skip('should continue immediately if a disabled account\'s access_token cookie is invalid but who\'s refresh_token cookie is valid', function (done) {

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
        stormpathAccount.status = 'DISABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
      },
      function (callback) {
        agent
          .get('/')
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

  it.skip('should continue immediately if a disabled account\'s refresh_token cookie is valid', function (done) {

    var agent = request.agent(defaultExpressApp);

    defaultExpressApp.get('/setCookie', createCookieRoute('access_token', ''));

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
        stormpathAccount.status = 'DISABLED';
        stormpathAccount.save(function (err) {
          callback(err);
        });
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

  it.skip('should use local validation, if specified by configuration', function (done) {

    var app = helpers.createStormpathExpressApp({
      application: stormpathApplication,
      web: {
        oauth2: {
          password: {
            validationStrategy: 'local'
          }
        }
      }
    });

    app.get('/', getUser, function (req, res) {
      res.json(req.user);
    });

    app.on('stormpath.ready', function () {

      var agent = request.agent(app);

      async.series([
        function (callback) {
          stormpathAccount.status = 'ENABLED';
          stormpathAccount.save(callback);
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
          // The first authentication attempt will take longer, because we have to fetch the
          // access token resources
          var a = new Date();
          agent
            .get('/')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return callback(err);
              }
              var b = new Date();
              assert((b - a) > 100, 'Expected first validation attempt to take some time, due to fetching access token resource');
              assert.equal(res.body.email, accountData.email);
              callback();
            });
        },
        function (callback) {
          var a = new Date();
          agent
            .get('/')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return callback(err);
              }
              var b = new Date();
              assert((b - a) < 20, 'Validation took too long - does not appear to be local validation');
              assert.equal(res.body.email, accountData.email);
              callback();
            });
        }
      ], done);
    });
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

});
