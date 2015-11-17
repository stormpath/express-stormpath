'use strict';

var assert = require('assert');
var cheerio = require('cheerio');
var fs = require('fs');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');

/**
 * Creates an Express application and configures the register feature to be
 * enabled.  Requires you to supply the stormpath application that should be
 * used.  Assumes that tenant api key and secret are defined in the environment.
 *
 * @param {object} stormpathApplication
 */
function DefaultRegistrationFixture(stormpathApplication) {
  this.expressApp = helpers.createStormpathExpressApp({
    application: {
      href: stormpathApplication.href
    },
    web: {
      register: {
        enabled: true
      }
    }
  });
  return this;
}
/**
 * Returns an object that has the default expected (and required) form fields of
 * givenName, surname, email, and password
 *
 * @return {object} postable form data object
 */
DefaultRegistrationFixture.prototype.defaultFormPost = function () {
  return {
    givenName: uuid.v4(),
    surname: uuid.v4(),
    email: uuid.v4() + '@test.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };
};

/**
 * Creates an Express application and configures the register feature with the
 * surname and given name as option fields.
 *
 * Requires you to supply the stormpath application that should be
 * used.  Assumes that tenant api key and secret are defined in the environment.
 *
 * @param {object} stormpathApplication
 */
function NamesOptionalRegistrationFixture(stormpathApplication) {
  this.expressApp = helpers.createStormpathExpressApp({
    application: {
      href: stormpathApplication.href
    },
    web: {
      register: {
        enabled: true,
        fields: {
          surname: {
            required: false
          },
          givenName: {
            required: false
          }
        }
      }
    }
  });
  return this;
}
/**
 * Returns an object that has the required form fields of email and password.
 * This fixture does not require given name or surname
 *
 * @return {object} postable form data object
 */
NamesOptionalRegistrationFixture.prototype.defaultFormPost = function () {
  return {
    email: uuid.v4() + '@test.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };
};

/**
 * Creates an Express applicaion, with a custom form field that has a specific
 * place in the field order.  Requires you to supply the stormpath application
 * that should be used.  Assumes that tenant api key and secret are defined in
 * the environment.
 *
 * @param {object]} stormpathApplication
 */
function CustomFieldRegistrationFixture(stormpathApplication) {
  this.expressApp = helpers.createStormpathExpressApp({
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
  return this;
}
/**
 * Returns an object that has the default expected (and required) form fields of
 * givenName, surname, email, and password.  Also populates the custom color
 * field.
 *
 * @return {object} postable form data object
 */
CustomFieldRegistrationFixture.prototype.defaultFormPost = function () {
  var formData = DefaultRegistrationFixture.prototype.defaultFormPost();
  formData.color = uuid.v4();
  return formData;
};

function assertDefaultForm(done) {
  return function (err, res) {
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
  };
}

describe.only('register', function () {
  var stormpathApplication;
  var stormpathClient;
  var customFieldRegistrationFixture;
  var defaultRegistrationFixture;
  var namesOptionalRegistrationFixture;

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

      defaultRegistrationFixture = new DefaultRegistrationFixture(stormpathApplication);
      defaultRegistrationFixture.expressApp.on('stormpath.ready', function () {
        customFieldRegistrationFixture = new CustomFieldRegistrationFixture(stormpathApplication);
        customFieldRegistrationFixture.expressApp.on('stormpath.ready', function () {
          namesOptionalRegistrationFixture = new NamesOptionalRegistrationFixture(stormpathApplication);
          namesOptionalRegistrationFixture.expressApp.on('stormpath.ready', function () {
            app.createAccount(existingUserData, done);
          });
        });
      });
    });
  });

  after(function (done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  describe('by default', function () {

    it('should bind to GET /register by default', function (done) {

      request(defaultRegistrationFixture.expressApp)
        .get('/register')
        .expect(200)
        .end(function (err) {
          done(err);
        });

    });

    it('should bind to POST /register if enabled', function (done) {

      request(defaultRegistrationFixture.expressApp)
        .post('/register')
        .end(function (err, res) {
          assert.notEqual(res.statusCode, 404);
          done(err);
        });

    });
  });

  describe('with a custom uri', function () {
    var app;
    before(function (done) {
      app = helpers.createStormpathExpressApp({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true,
            uri: '/customRegistrationUri'
          }
        }
      });
      app.on('stormpath.ready', done);
    });

    it('should bind to that uri', function (done) {
      request(app)
        .get('/customRegistrationUri')
        .expect(200)
        .end(assertDefaultForm(done));
    });

    it('should not bind to the other uri', function (done) {
      request(app)
        .get('/register')
        .expect(404)
        .end(done);
    });
  });

  describe('if email verification is enabled', function () {

    var fixture;

    before(function (done) {
      helpers.setEmailVerificationStatus(stormpathApplication, 'ENABLED', function (err) {
        if (err) {
          return done(err);
        }
        fixture = new DefaultRegistrationFixture(stormpathApplication);
        fixture.expressApp.on('stormpath.ready', done);
      });
    });

    after(function (done) {
      helpers.setEmailVerificationStatus(stormpathApplication, 'DISABLED', done);
    });

    it('should return the user to the login page with ?status=unverified', function (done) {

      var config = fixture.expressApp.get('stormpathConfig');

      request(fixture.expressApp)
        .post('/register')
        .set('Accept', 'text/html')
        .type('form')
        .send(fixture.defaultFormPost())
        .expect(302)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          assert.equal(res.headers.location, config.web.login.uri + '?status=unverified');
          done();
        });

    });
  });

  describe('with Accept: application/json requests', function () {
    describe('by default', function () {

      it('should return a JSON error if the request is missing the givenName', function (done) {

        var formData = defaultRegistrationFixture.defaultFormPost();
        delete formData.givenName;

        request(defaultRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(formData)
          .expect(400)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert.equal(res.body.error, 'givenName required.');

            done();
          });

      });


      it('should create an account if the data is valid', function (done) {

        var formData = defaultRegistrationFixture.defaultFormPost();

        request(defaultRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(formData)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var json = JSON.parse(res.text);

            assert(json.href);
            assert.equal(json.givenName, formData.givenName);
            assert.equal(json.surname, formData.surname);
            assert.equal(json.email, formData.email);

            done();
          });

      });

      it('should store additional fields in customData', function (done) {

        var formData = defaultRegistrationFixture.defaultFormPost();

        formData.color = 'black';
        formData.customData = {
          music: 'rock'
        };

        request(defaultRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(formData)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var json = JSON.parse(res.text);
            defaultRegistrationFixture.expressApp.get('stormpathClient').getAccount(json.href, function (err, account) {
              if (err) {
                return done(err);
              }

              account.getCustomData(function (err, data) {
                if (err) {
                  return done(err);
                }

                assert.equal(account.href, json.href);
                assert.equal(data.color, formData.color);
                assert.equal(data.music, formData.customData.music);

                done();
              });
            });
          });

      });
    });

    describe('if givenName and surname are optional', function () {

      it('should set givenName and surname to \'UNKNOWN\' if not provided', function (done) {

        var formData = namesOptionalRegistrationFixture.defaultFormPost();

        request(namesOptionalRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(formData)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert.equal(res.body.givenName, 'UNKNOWN');
            assert.equal(res.body.surname, 'UNKNOWN');
            assert.equal(res.body.email, formData.email);
            done();
          });

      });

    });


  });

  describe('with Accept: text/html requests', function () {

    describe('by default', function () {

      it('should render a form with ONLY first name, last name, email, and password fields by default', function (done) {

        request(defaultRegistrationFixture.expressApp)
          .get('/register')
          .set('Accept', 'text/html')
          .expect(200)
          .end(assertDefaultForm(done));

      });

      it('should allow the developer to specify custom fields', function (done) {

        var config = customFieldRegistrationFixture.expressApp.get('stormpathConfig');

        request(customFieldRegistrationFixture.expressApp)
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

      it('should render an error if the givenName field is not supplied', function (done) {

        var formData = defaultRegistrationFixture.defaultFormPost();
        delete formData.givenName;

        request(defaultRegistrationFixture.expressApp)
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
            assert($('.alert.alert-danger p').length);
            assert.notEqual($('.alert.alert-danger p').text().indexOf('givenName'), -1);

            done();
          });

      });



      it('should re-render the submitted form data if the submission fails', function (done) {

        var formData = customFieldRegistrationFixture.defaultFormPost();
        // cause password strength validation to fail
        formData.password = '1';

        request(customFieldRegistrationFixture.expressApp)
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

      it('should store additional fields on the customData object', function (done) {

        var formData = customFieldRegistrationFixture.defaultFormPost();
        formData.color = 'black';
        formData.music = 'rock';

        request(customFieldRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send(formData)
          .expect(302)
          .end(function (err) {
            if (err) {
              return done(err);
            }

            stormpathApplication.getAccounts({ email: formData.email }, function (err, accounts) {
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

                assert.equal(account.email, formData.email);
                assert.equal(data.color, formData.color);
                assert.equal(data.music, formData.music);

                done();
              });
            });

          });
      });

      it('should redirect the user to the login page with ?status=created', function (done) {

        request(defaultRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send(defaultRegistrationFixture.defaultFormPost())
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



    describe('if autoLogin is enabled', function () {

      var app;

      before(function (done) {
        app = helpers.createStormpathExpressApp({
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
        app.on('stormpath.ready', done);
      });

      it('should redirect the user to the dynamic nextUri', function (done) {

        request(app)
          .post('/register?next=%2Fyo')
          .set('Accept', 'text/html')
          .type('form')
          .send(DefaultRegistrationFixture.prototype.defaultFormPost())
          .expect(302)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert.equal(res.headers.location, '/yo');
            done();
          });

      });

      it('should redirect the user to the configured nextUri', function (done) {

        request(app)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send(DefaultRegistrationFixture.prototype.defaultFormPost())
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

    describe('if givenName and surname are optional', function () {

      it('should set givenName and surname to \'UNKNOWN\' if not provided', function (done) {

        var formData = namesOptionalRegistrationFixture.defaultFormPost();

        request(namesOptionalRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send(formData)
          .expect(302)
          .end(function (err) {
            if (err) {
              return done(err);
            }

            stormpathApplication.getAccounts({ email: formData.email }, function (err, accounts) {
              if (err) {
                return done(err);
              }

              if (accounts.items.length === 0) {
                return done(new Error('No account was created!'));
              }

              var account = accounts.items[0];
              assert.equal(account.email, formData.email);
              assert.equal(account.givenName, 'UNKNOWN');
              assert.equal(account.surname, 'UNKNOWN');

              done();
            });
          });

      });
    });

    describe('if configured with spaRoot', function () {
      it('should return a SPA page instead of the default form', function (done) {
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
    });
  });
});
