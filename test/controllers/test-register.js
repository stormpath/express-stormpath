'use strict';

var assert = require('assert');
var async = require('async');
var cheerio = require('cheerio');
var fs = require('fs');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

describe('register', function () {
  var stormpathApplication;
  var stormpathClient;

  var existingUserData = {
    givenName: uuid.v4(),
    surname: uuid.v4(),
    email: 'robert+' + uuid.v4() + '@stormpath.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };

  before(function (done) {
    stormpathClient = helpers.createClient();
    helpers.createApplication(stormpathClient, function (err, app) {
      if (err) {
        return done(err);
      }

      stormpathApplication = app;
      app.createAccount(existingUserData, done);
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should bind to GET /register if enabled', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .get('/register')
        .expect(200)
        .end(function (err) {
          done(err);
        });
    });
  });

  it('should bind to POST /register if enabled', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true
        }
      }
    });

    app.on('stormpath.ready', function () {
      request(app)
        .post('/register')
        .end(function (err, res) {
          assert.notEqual(res.statusCode, 404);
          done(err);
        });
    });
  });

  it('should bind to another URL if specified', function (done) {
    var app = helpers.createStormpathExpressApp({
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true,
          uri: '/newregister'
        }
      }
    });

    app.on('stormpath.ready', function () {
      async.parallel([
        function (cb) {
          request(app)
            .get('/newregister')
            .expect(200)
            .end(cb);
        },
        function (cb) {
          request(app)
            .get('/register')
            .expect(404)
            .end(cb);
        }
      ], done);
    });
  });

  describe('via JSON API', function () {
    it('should return a JSON error if the account data is not valid', function (done) {
      async.series([
        function (cb) {
          var app = helpers.createStormpathExpressApp({
            application: {
              href: stormpathApplication.href
            },
            web: {
              register: {
                enabled: true
              }
            }
          });

          app.on('stormpath.ready', function () {
            request(app)
              .post('/register')
              .set('Accept', 'application/json')
              .type('json')
              .expect(400)
              .end(function (err, res) {
                if (err) {
                  return done(err);
                }

                assert.equal(res.body.error, 'email required.');

                cb();
              });
          });
        },
        function (cb) {
          var app = helpers.createStormpathExpressApp({
            application: {
              href: stormpathApplication.href
            },
            web: {
              register: {
                enabled: true,
                fields: {
                  color: {
                    name: 'color',
                    placeholder: 'Color',
                    required: true,
                    type: 'text'
                  }
                },
                fieldOrder: ['givenName', 'surname', 'color', 'email', 'password']
              }
            }
          });

          app.on('stormpath.ready', function () {
            request(app)
              .post('/register')
              .set('Accept', 'application/json')
              .type('json')
              .send({
                givenName: uuid.v4(),
                surname: uuid.v4(),
                email: uuid.v4() + '@test.com',
                password: uuid.v4() + uuid.v4().toUpperCase() + '!'
              })
              .expect(400)
              .end(function (err, res) {
                if (err) {
                  return done(err);
                }

                var json = JSON.parse(res.text);
                if (!json.error) {
                  return done(new Error('No JSON error returned.'));
                }

                cb();
              });
          });
        }
      ], function () {
        done();
      });
    });

    it('should create an account if the data is valid', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          }
        }
      });

      app.on('stormpath.ready', function () {
        var givenName = uuid.v4();
        var surname = uuid.v4();
        var email = uuid.v4() + '@test.com';
        var password = uuid.v4() + uuid.v4().toUpperCase() + '!';

        request(app)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send({
            givenName: givenName,
            surname: surname,
            email: email,
            password: password
          })
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var json = JSON.parse(res.text);

            assert(json.href);
            assert.equal(json.givenName, givenName);
            assert.equal(json.surname, surname);
            assert.equal(json.email, email);

            done();
          });
      });
    });

    it('should set givenName and surname to \'Anonymous\' if not provided', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          }
        }
      });

      app.on('stormpath.ready', function () {
        var email = uuid.v4() + '@test.com';
        var password = uuid.v4() + uuid.v4().toUpperCase() + '!';

        request(app)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send({
            email: email,
            password: password
          })
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert.equal(res.body.givenName, 'Anonymous');
            assert.equal(res.body.surname, 'Anonymous');
            assert.equal(res.body.email, email);
            done();
          });
      });
    });

    it('should store additional account data in customData if the data is valid', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          }
        }
      });
      app.on('stormpath.ready', function () {
        var color = 'black';
        var music = 'rock';

        request(app)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send({
            givenName: uuid.v4(),
            surname: uuid.v4(),
            email: uuid.v4() + '@test.com',
            password: uuid.v4() + uuid.v4().toUpperCase() + '!',
            color: color,
            customData: {
              music: music
            }
          })
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var json = JSON.parse(res.text);
            app.get('stormpathClient').getAccount(json.href, function (err, account) {
              if (err) {
                return done(err);
              }

              account.getCustomData(function (err, data) {
                if (err) {
                  return done(err);
                }

                assert.equal(account.href, json.href);
                assert.equal(data.color, color);
                assert.equal(data.music, music);

                done();
              });
            });
          });
      });
    });
  });

  describe('via HTML API', function () {
    it('should trigger HTML responses if an accept: text/html header is provided', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          }
        }
      });

      app.on('stormpath.ready', function () {
        request(app)
          .get('/register')
          .set('Accept', 'text/html')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var $ = cheerio.load(res.text);

            assert($('html').html());
            assert($('head').html());
            assert($('body').html());

            done();
          });
      });
    });

    it('should return a SPA page if config.web.spaRoot is provided', function (done) {
      var filename = '/tmp/' + uuid.v4();
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          },
          spaRoot: filename
        }
      });

      fs.writeFile(filename, '<html><head><script></script></head><body><p>hi</p></body></html>', function (err) {
        if (err) {
          return done(err);
        }
      });

      app.on('stormpath.ready', function () {
        request(app)
          .get('/register')
          .set('Accept', 'text/html')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var $ = cheerio.load(res.text);

            assert($('html').html());
            assert($('head').html());
            assert.equal($('body p').html(), 'hi');

            fs.unlink(filename, function (err) {
              return done(err);
            });
          });
      });
    });

    it('should render ONLY first name, last name, email, and password fields by default', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          }
        }
      });
      app.on('stormpath.ready', function () {
        request(app)
          .get('/register')
          .set('Accept', 'text/html')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var $ = cheerio.load(res.text);

            var formFields = $('form input');

            assert.equal(formFields.length, 4);
            assert.equal($(formFields[0]).attr('name'), 'givenName');
            assert.equal($(formFields[1]).attr('name'), 'surname');
            assert.equal($(formFields[2]).attr('name'), 'email');
            assert.equal($(formFields[3]).attr('name'), 'password');

            done();
          });
      });
    });

    it('should allow the developer to specify custom fields', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true,
            fields: {
              color: {
                name: 'color',
                placeholder: 'Color',
                required: false,
                type: 'text'
              }
            },
            fieldOrder: ['givenName', 'surname', 'color', 'email', 'password']
          }
        }
      });

      app.on('stormpath.ready', function () {
        var config = app.get('stormpathConfig');
        request(app)
          .get('/register')
          .set('Accept', 'text/html')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var $ = cheerio.load(res.text);

            var formFields = $('form input');

            assert(formFields.length, 5);

            var givenNameField = $(formFields[0]);
            var surnameField = $(formFields[1]);
            var colorField = $(formFields[2]);
            var emailField = $(formFields[3]);
            var passwordField = $(formFields[4]);

            assert.equal(givenNameField.attr('placeholder'), config.web.register.fields.givenName.placeholder);
            assert.equal(givenNameField.attr('required') === 'required', config.web.register.fields.givenName.required);
            assert.equal(givenNameField.attr('type'), config.web.register.fields.givenName.type);

            assert.equal(surnameField.attr('placeholder'), config.web.register.fields.surname.placeholder);
            assert.equal(surnameField.attr('required') === 'required', config.web.register.fields.surname.required);
            assert.equal(surnameField.attr('type'), config.web.register.fields.surname.type);

            assert.equal(colorField.attr('placeholder'), config.web.register.fields.color.placeholder);
            assert.equal(colorField.attr('required') === 'required', config.web.register.fields.color.required);
            assert.equal(colorField.attr('type'), config.web.register.fields.color.type);

            assert.equal(emailField.attr('placeholder'), config.web.register.fields.email.placeholder);
            assert.equal(emailField.attr('required') === 'required', config.web.register.fields.email.required);
            assert.equal(emailField.attr('type'), config.web.register.fields.email.type);

            assert.equal(passwordField.attr('placeholder'), config.web.register.fields.password.placeholder);
            assert.equal(passwordField.attr('required') === 'required', config.web.register.fields.password.required);
            assert.equal(passwordField.attr('type'), config.web.register.fields.password.type);

            done();
          });
      });
    });

    it('should render an error if a required field is not supplied', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true,
            fields: {
              color: {
                name: 'color',
                placeholder: 'Color',
                required: true,
                type: 'text'
              }
            },
            fieldOrder: ['givenName', 'surname', 'color', 'email', 'password']
          }
        }
      });

      app.on('stormpath.ready', function () {
        var givenName = uuid.v4();
        var surname = uuid.v4();
        var email = uuid.v4() + '@test.com';
        var password = uuid.v4() + uuid.v4().toUpperCase() + '!';

        request(app)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send({
            givenName: givenName,
            surname: surname,
            email: email,
            password: password
          })
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var $ = cheerio.load(res.text);
            assert($('.alert.alert-danger p').length);
            assert.notEqual($('.alert.alert-danger p').text().indexOf('color'), -1);

            done();
          });
      });
    });

    it('should set givenName and surname to \'Anonymous\' if not provided', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          }
        }
      });

      app.on('stormpath.ready', function () {
        var email = uuid.v4() + '@test.com';
        var password = uuid.v4() + uuid.v4().toUpperCase() + '!';

        request(app)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send({
            email: email,
            password: password
          })
          .expect(302)
          .end(function (err) {
            if (err) {
              return done(err);
            }

            stormpathApplication.getAccounts({ email: email }, function (err, accounts) {
              if (err) {
                return done(err);
              }

              if (accounts.items.length === 0) {
                return done(new Error('No account was created!'));
              }

              var account = accounts.items[0];
              assert.equal(account.email, email);
              assert.equal(account.givenName, 'Anonymous');
              assert.equal(account.surname, 'Anonymous');

              done();
            });
          });
      });
    });

    it('should re-render form data if a registration is unsuccessful', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true,
            fields: {
              color: {
                name: 'color'
              }
            },
            fieldOrder: ['givenName', 'surname', 'color', 'email', 'password']
          }
        }
      });

      app.on('stormpath.ready', function () {

        var formData = {
          givenName: uuid.v4(),
          surname: uuid.v4(),
          color: uuid.v4(),
          email: uuid.v4() + '@test.com'
          // Password is omitted, to cause the form submission to fail
        };

        request(app)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send(formData)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var $ = cheerio.load(res.text);

            var formFields = $('form input');

            assert(formFields.length, 5);

            var givenNameField = $(formFields[0]);
            var surnameField = $(formFields[1]);
            var colorField = $(formFields[2]);
            var emailField = $(formFields[3]);
            var passwordField = $(formFields[4]);

            // The core account fields should be re-populated with the
            // user-submited data:

            assert.equal(givenNameField.attr('value'), formData.givenName);
            assert.equal(surnameField.attr('value'), formData.surname);
            assert.equal(emailField.attr('value'), formData.email);

            // The custom data fields should be re-populated as well:

            assert.equal(colorField.attr('value'), formData.color);

            // The password should not be re-populated (for security):
            assert.equal(passwordField.attr('value'), undefined);

            done();
          });
      });
    });

    it('should store additional account data in customData if the data is valid', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true,
            fields: {
              color: {
                name: 'color',
                placeholder: 'Color',
                required: true,
                type: 'text'
              },
              music: {
                name: 'music',
                placeholder: 'Music',
                required: false,
                type: 'text'
              }
            },
            fieldOrder: ['givenName', 'surname', 'email', 'color', 'music', 'password']
          }
        }
      });

      app.on('stormpath.ready', function () {
        var givenName = uuid.v4();
        var surname = uuid.v4();
        var email = uuid.v4() + '@test.com';
        var color = 'black';
        var music = 'rock';
        var password = uuid.v4() + uuid.v4().toUpperCase() + '!';

        request(app)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send({
            givenName: givenName,
            surname: surname,
            email: email,
            color: color,
            music: music,
            password: password
          })
          .expect(302)
          .end(function (err) {
            if (err) {
              return done(err);
            }

            stormpathApplication.getAccounts({ email: email }, function (err, accounts) {
              if (err) {
                return done(err);
              }

              if (accounts.items.length === 0) {
                return done(new Error('No account was created!'));
              }

              var account = accounts.items[0];
              account.getCustomData(function (err, data) {
                if (err) {
                  return done(err);
                }

                assert.equal(account.email, email);
                assert.equal(data.color, color);
                assert.equal(data.music, music);

                done();
              });
            });
          });
      });
    });

    it('should return the user to the login page with ?status=unverified if the account is unverified', function (done) {

      async.series([
        function (callback) {
          helpers.setEmailVerificationStatus(stormpathApplication, 'ENABLED', callback);
        },
        function (callback) {
          var app = helpers.createStormpathExpressApp({
            application: {
              href: stormpathApplication.href
            },
            web: {
              register: {
                enabled: true
              }
            }
          });

          app.on('stormpath.ready', function () {
            var email = uuid.v4() + '@test.com';
            var password = uuid.v4() + uuid.v4().toUpperCase() + '!';
            var config = app.get('stormpathConfig');

            request(app)
              .post('/register')
              .set('Accept', 'text/html')
              .type('form')
              .send({
                email: email,
                password: password
              })
              .expect(302)
              .end(function (err, res) {
                if (err) {
                  return callback(err);
                }

                assert.equal(res.headers.location, config.web.login.uri + '?status=unverified');
                callback();
              });
          });
        }
      ], function () {
        helpers.setEmailVerificationStatus(stormpathApplication, 'DISABLED', done);
      });
    });

    it('should redirect the user to the nextUri if authoAuthorize is enabled', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            autoLogin: true,
            enabled: true,
            nextUri: '/woot'
          }
        }
      });

      app.on('stormpath.ready', function () {
        var email = uuid.v4() + '@test.com';
        var password = uuid.v4() + uuid.v4().toUpperCase() + '!';

        request(app)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send({
            email: email,
            password: password
          })
          .expect(302)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert.equal(res.headers.location, '/woot');
            done();
          });
      });
    });

    it('should redirect the user to the ?next uri if authoAuthorize is enabled', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            autoLogin: true,
            enabled: true,
            nextUri: '/woot'
          }
        }
      });

      app.on('stormpath.ready', function () {
        var email = uuid.v4() + '@test.com';
        var password = uuid.v4() + uuid.v4().toUpperCase() + '!';

        request(app)
          .post('/register?next=%2Fyo')
          .set('Accept', 'text/html')
          .type('form')
          .send({
            email: email,
            password: password
          })
          .expect(302)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert.equal(res.headers.location, '/yo');
            done();
          });
      });
    });

    it('should redirect the user to the login page with ?status=created if autoLogin is not enabled', function (done) {
      var app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          }
        }
      });

      app.on('stormpath.ready', function () {
        var email = uuid.v4() + '@test.com';
        var password = uuid.v4() + uuid.v4().toUpperCase() + '!';

        request(app)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send({
            email: email,
            password: password
          })
          .expect(302)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert.equal(res.headers.location, '/login?status=created');
            done();
          });
      });
    });
  });
});
