'use strict';

var assert = require('assert');
var cheerio = require('cheerio');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var SpaRootFixture = require('../fixtures/spa-root-fixture');

/*

  it should not show a default field if that field is enabled: false by developer configuration

  refactor: validateAccount -> validateFormData
  refactor: post reg handler tests to use new fixture
 */

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
    cacheOptions: {
      ttl: 0
    },
    web: {
      register: {
        enabled: true
      },
      produces: ['text/html', 'application/json']
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
 * This object is the default view model that we expect from the registration
 * endpoint when:
 *  * The registration fields have not been customized
 *  * No provider account stores have been mapped to the application
 *
 * @type {Object}
 */
DefaultRegistrationFixture.prototype.defaultJsonViewModel = {
  'accountStores': [],
  'form': {
    'fields': [
      {
        'label': 'First Name',
        'name': 'givenName',
        'placeholder': 'First Name',
        'required': true,
        'type': 'text'
      },
      {
        'label': 'Last Name',
        'name': 'surname',
        'placeholder': 'Last Name',
        'required': true,
        'type': 'text'
      },
      {
        'label': 'Email',
        'name': 'email',
        'placeholder': 'Email',
        'required': true,
        'type': 'email'
      },
      {
        'label': 'Password',
        'name': 'password',
        'placeholder': 'Password',
        'required': true,
        'type': 'password'
      }
    ]
  }
};

/**
 * Creates an Express application and configures the register feature with the
 * surname and given name as optional (not required) fields.
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
    cacheOptions: {
      ttl: 0
    },
    web: {
      register: {
        enabled: true,
        form: {
          fields: {
            surname: {
              required: false
            },
            givenName: {
              required: false
            }
          }
        }
      },
      produces: ['text/html', 'application/json']
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
NamesOptionalRegistrationFixture.prototype.namesOmittedFormPost = function () {
  return {
    email: uuid.v4() + '@test.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!'
  };
};

/**
 * Returns an object that has the required form fields of email and password,
 * and it supplies the first and last names as well.
 *
 * @return {object} postable form data object
 */
NamesOptionalRegistrationFixture.prototype.namesProvidedFormPost = function () {
  return {
    email: uuid.v4() + '@test.com',
    password: uuid.v4() + uuid.v4().toUpperCase() + '!',
    givenName: 'foo',
    surname: 'bar'
  };
};

/**
 * Creates an Express application and configures the register feature with the
 * surname and given name as disabled fields.
 *
 * Requires you to supply the stormpath application that should be
 * used.  Assumes that tenant api key and secret are defined in the environment.
 *
 * @param {object} stormpathApplication
 */
function NamesDisabledRegistrationFixture(stormpathApplication) {
  this.expressApp = helpers.createStormpathExpressApp({
    application: {
      href: stormpathApplication.href
    },
    cacheOptions: {
      ttl: 0
    },
    web: {
      register: {
        enabled: true,
        form: {
          fields: {
            surname: {
              enabled: false
            },
            givenName: {
              enabled: false
            }
          }
        }
      },
      produces: ['text/html', 'application/json']
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
NamesDisabledRegistrationFixture.prototype.defaultFormPost = function () {
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
    cacheOptions: {
      ttl: 0
    },
    web: {
      register: {
        enabled: true,
        form: {
          fields: {
            color: {
              enabled: true,
              name: 'color',
              placeholder: 'Favorite Color',
              required: true,
              type: 'text'
            },
            music: {
              enabled: true,
              name: 'music',
              placeholder: 'Music Preference',
              required: false,
              type: 'text'
            }
          },
          fieldOrder: ['givenName', 'surname', 'color', 'music', 'email', 'password']
        }
      },
      produces: ['text/html', 'application/json']
    }
  });
  return this;
}
/**
 * Returns an object that has the default expected (and required) form fields of
 * givenName, surname, email, and password.  Also populates the custom color
 * field.
 *
 * This function purposely places one field at the root of the object and one
 * field in the custom data object, to assert that we can supply a field in
 * either location.  This is desireable because it's easier for HTML forms
 * to use the root object, whereas JSON clients will likely supply the
 * customDat object directly.
 *
 * @return {object} postable form data object
 */
CustomFieldRegistrationFixture.prototype.defaultFormPost = function () {
  var formData = DefaultRegistrationFixture.prototype.defaultFormPost();
  formData.color = uuid.v4();
  formData.customData = {
    music: uuid.v4()
  };
  return formData;
};

function assertDefaultFormResponse(done) {
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

function assertCustomDataRegistration(fixture, formData, done) {
  return function (err) {
    if (err) {
      return done(err);
    }

    fixture.expressApp.get('stormpathApplication').getAccounts({ email: formData.email }, function (err, accounts) {
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
        assert.equal(data.music, formData.customData.music);

        done();
      });
    });
  };
}

describe('register', function () {
  var stormpathApplication;
  var stormpathClient;
  var customFieldRegistrationFixture;
  var defaultRegistrationFixture;
  var namesDisabledRegistrationFixture;
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
            namesDisabledRegistrationFixture = new NamesDisabledRegistrationFixture(stormpathApplication);
            namesDisabledRegistrationFixture.expressApp.on('stormpath.ready', function () {
              app.createAccount(existingUserData, done);
            });
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
          },
          produces: ['text/html', 'application/json']
        }
      });
      app.on('stormpath.ready', done);
    });

    it('should bind to that uri', function (done) {
      request(app)
        .get('/customRegistrationUri')
        .expect(200)
        .end(assertDefaultFormResponse(done));
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

    describe('with Accept: application/json requests', function () {
      it('should create an account if the data is valid, and not expose the email verification token', function (done) {

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

            assert(json.account.href);
            assert.equal(json.account.givenName, formData.givenName);
            assert.equal(json.account.surname, formData.surname);
            assert.equal(json.account.email, formData.email);
            assert.equal(json.account.emailVerificationToken, undefined);

            done();
          });

      });
    });

    // it should do json the right way
  });

  describe('with Accept: application/json requests', function () {

    describe('by default', function () {

      it('should return a JSON view model', function (done) {
        request(defaultRegistrationFixture.expressApp)
          .get('/register')
          .set('Accept', 'application/json')
          .expect(200, defaultRegistrationFixture.defaultJsonViewModel, done);
      });

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

            assert.equal(res.body.message, 'First Name required.');

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

            assert(json.account.href);
            assert.equal(json.account.givenName, formData.givenName);
            assert.equal(json.account.surname, formData.surname);
            assert.equal(json.account.email, formData.email);

            done();
          });

      });

      it('should reject fields that are not configured', function (done) {
        var formData = defaultRegistrationFixture.defaultFormPost();
        formData.otherField = uuid.v4();

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

            assert.equal(res.body.message, 'otherField is not a configured registration field.');

            done();
          });
      });

    });

    describe('if a custom field is configured', function () {
      it('should store the custom field data in customData', function (done) {
        var fixture = customFieldRegistrationFixture;
        var formData = fixture.defaultFormPost();
        request(customFieldRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(formData)
          .expect(200)
          .end(assertCustomDataRegistration(fixture, formData, done));

      });
    });

    describe('if givenName and surname are optional (not required)', function () {

      it('should set givenName and surname to the user-provided values', function (done) {

        var formData = namesOptionalRegistrationFixture.namesProvidedFormPost();

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

            assert.equal(res.body.account.givenName, formData.givenName);
            assert.equal(res.body.account.surname, formData.surname);
            assert.equal(res.body.account.email, formData.email);
            done();
          });

      });

      it('should set givenName and surname to \'UNKNOWN\' if not provided', function (done) {

        var formData = namesOptionalRegistrationFixture.namesOmittedFormPost();

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

            assert.equal(res.body.account.givenName, 'UNKNOWN');
            assert.equal(res.body.account.surname, 'UNKNOWN');
            assert.equal(res.body.account.email, formData.email);
            done();
          });

      });

    });

    describe('if givenName and surname are disabled', function () {

      it('should set givenName and surname to \'UNKNOWN\'', function (done) {

        var formData = namesDisabledRegistrationFixture.defaultFormPost();

        request(namesDisabledRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'application/json')
          .type('json')
          .send(formData)
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            assert.equal(res.body.account.givenName, 'UNKNOWN');
            assert.equal(res.body.account.surname, 'UNKNOWN');
            assert.equal(res.body.account.email, formData.email);
            done();
          });
      });
    });
  });


  describe('if configured with a SPA root', function () {

    var spaRootFixture;

    before(function (done) {
      spaRootFixture = new SpaRootFixture({
        application: {
          href: stormpathApplication.href
        },
        web: {
          register: {
            enabled: true
          },
          produces: ['text/html', 'application/json']
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
          .get(config.web.register.uri)
          .set('Accept', 'text/html')
          .expect(200)
          .end(spaRootFixture.assertResponse(done));
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
          .end(assertDefaultFormResponse(done));

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
            assert.notEqual($('.alert.alert-danger p').text().indexOf('First Name'), -1);

            done();
          });

      });

      it('should re-render the submitted form data if the submission fails', function (done) {

        var formData = defaultRegistrationFixture.defaultFormPost();
        // cause password strength validation to fail
        formData.password = '1';

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

            var formFields = $('form input');

            assert(formFields.length, 5);

            var givenNameField = $(formFields[0]);
            var surnameField = $(formFields[1]);
            var emailField = $(formFields[2]);
            var passwordField = $(formFields[3]);

            // The core account fields should be re-populated with the
            // user-submited data:

            assert.equal(givenNameField.attr('value'), formData.givenName);
            assert.equal(surnameField.attr('value'), formData.surname);
            assert.equal(emailField.attr('value'), formData.email);

            // The password should not be re-populated (for security):
            assert.equal(passwordField.attr('value'), undefined);

            done();
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

      it('should reject fields that are not configured', function (done) {
        var formData = defaultRegistrationFixture.defaultFormPost();
        formData.otherField = uuid.v4();

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
            assert.notEqual($('.alert.alert-danger p').text().indexOf('otherField'), -1);

            done();
          });
      });

    });

    describe('if a custom field is configured', function () {
      it('should show the field in the correct order', function (done) {

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
            var musicField = $(formFields[3]);
            var emailField = $(formFields[4]);
            var passwordField = $(formFields[5]);

            assert.equal(givenNameField.attr('placeholder'), config.web.register.form.fields.givenName.placeholder);
            assert.equal(givenNameField.attr('required') === 'required', config.web.register.form.fields.givenName.required);
            assert.equal(givenNameField.attr('type'), config.web.register.form.fields.givenName.type);

            assert.equal(surnameField.attr('placeholder'), config.web.register.form.fields.surname.placeholder);
            assert.equal(surnameField.attr('required') === 'required', config.web.register.form.fields.surname.required);
            assert.equal(surnameField.attr('type'), config.web.register.form.fields.surname.type);

            assert.equal(colorField.attr('placeholder'), config.web.register.form.fields.color.placeholder);
            assert.equal(colorField.attr('required') === 'required', config.web.register.form.fields.color.required);
            assert.equal(colorField.attr('type'), config.web.register.form.fields.color.type);

            assert.equal(musicField.attr('placeholder'), config.web.register.form.fields.music.placeholder);
            assert.equal(musicField.attr('required') === 'required', config.web.register.form.fields.music.required);
            assert.equal(musicField.attr('type'), config.web.register.form.fields.music.type);

            assert.equal(emailField.attr('placeholder'), config.web.register.form.fields.email.placeholder);
            assert.equal(emailField.attr('required') === 'required', config.web.register.form.fields.email.required);
            assert.equal(emailField.attr('type'), config.web.register.form.fields.email.type);

            assert.equal(passwordField.attr('placeholder'), config.web.register.form.fields.password.placeholder);
            assert.equal(passwordField.attr('required') === 'required', config.web.register.form.fields.password.required);
            assert.equal(passwordField.attr('type'), config.web.register.form.fields.password.type);

            done();

          });
      });

      it('should store the custom field data on the customData object', function (done) {
        var fixture = customFieldRegistrationFixture;
        var formData = fixture.defaultFormPost();

        request(customFieldRegistrationFixture.expressApp)
          .post('/register')
          .set('Accept', 'text/html')
          .type('form')
          .send(formData)
          .expect(302)
          .end(assertCustomDataRegistration(fixture, formData, done));
      });

      it('should re-render the submitted custom field data if the submission fails', function (done) {

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

            var colorField = $(formFields[2]);

            assert.equal(colorField.attr('value'), formData.color);

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
            },
            produces: ['text/html', 'application/json']
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

    describe('if givenName and surname are optional (not required)', function () {

      it('should set givenName and surname to \'UNKNOWN\' if not provided', function (done) {

        var formData = namesOptionalRegistrationFixture.namesOmittedFormPost();

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

    describe('if givenName and surname are disabled', function () {
      it('should not show those fields', function (done) {
        request(namesDisabledRegistrationFixture.expressApp)
          .get('/register')
          .set('Accept', 'text/html')
          .expect(200)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }

            var $ = cheerio.load(res.text);

            var formFields = $('form input');

            assert.equal(formFields.length, 2);
            assert.equal($(formFields[0]).attr('name'), 'email');
            assert.equal($(formFields[1]).attr('name'), 'password');

            done();
          });
      });

      it('should set givenName and surname to \'UNKNOWN\'', function (done) {

        var formData = namesDisabledRegistrationFixture.defaultFormPost();

        request(namesDisabledRegistrationFixture.expressApp)
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

  });
});
