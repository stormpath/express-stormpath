'use strict';

var assert = require('assert');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var WidgetFixture = require('../fixtures/widget-fixture');
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
DefaultRegistrationFixture.prototype.defaultJsonPost = function () {
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
    'fields': [{
      'label': 'First Name',
      'name': 'givenName',
      'placeholder': 'First Name',
      'required': true,
      'type': 'text'
    }, {
      'label': 'Last Name',
      'name': 'surname',
      'placeholder': 'Last Name',
      'required': true,
      'type': 'text'
    }, {
      'label': 'Email',
      'name': 'email',
      'placeholder': 'Email',
      'required': true,
      'type': 'email'
    }, {
      'label': 'Password',
      'name': 'password',
      'placeholder': 'Password',
      'required': true,
      'type': 'password'
    }]
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
NamesOptionalRegistrationFixture.prototype.namesOmittedJsonPost = function () {
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
NamesOptionalRegistrationFixture.prototype.namesProvidedJsonPost = function () {
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
NamesDisabledRegistrationFixture.prototype.defaultJsonPost = function () {
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
 * This function purposely places one field at the root of the object and one
 * field in the custom data object, to assert that we can supply a field in
 * either location.  This is desireable because it's easier for HTML forms
 * to use the root object, whereas JSON clients will likely supply the
 * customDat object directly.
 *
 * @return {object} postable form data object
 */
CustomFieldRegistrationFixture.prototype.defaultJsonPost = function () {
  var formData = DefaultRegistrationFixture.prototype.defaultJsonPost();
  formData.color = uuid.v4();
  formData.customData = {
    music: uuid.v4()
  };
  return formData;
};

function assertCustomDataRegistration(fixture, formData, done) {
  return function (err) {
    if (err) {
      return done(err);
    }

    fixture.expressApp.get('stormpathApplication').getAccounts({
      email: formData.email
    }, function (err, accounts) {
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
          }
        }
      });
      app.on('stormpath.ready', done);
    });

    it('should bind to that uri', function (done) {
      request(app)
        .get('/customRegistrationUri')
        .expect(200)
        .end(done);
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

    describe('GET /verify with accept text/html', () => {
      var widgetFixture;
      var testResponse;

      before(function (done) {
        widgetFixture = new WidgetFixture('showRegistration');

        var expressApp = defaultRegistrationFixture.expressApp;
        var config = expressApp.get('stormpathConfig');

        request(expressApp)
          .get(config.web.register.uri)
          .set('Accept', 'text/html')
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }

            testResponse = res;

            done();
          });
      });

      it('should return a widget html response', () => {
        widgetFixture.assertResponse(testResponse);
      });
    });

    describe('with Accept: application/json requests', function () {
      it('should create an account if the data is valid, and not expose the email verification token', function (done) {
        var formData = defaultRegistrationFixture.defaultJsonPost();

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

    describe('by default', function () {
      it('should return a JSON view model', function (done) {
        request(defaultRegistrationFixture.expressApp)
          .get('/register')
          .set('Accept', 'application/json')
          .expect(200, defaultRegistrationFixture.defaultJsonViewModel, done);
      });

      it('should return a JSON error if the request is missing the givenName', function (done) {
        var formData = defaultRegistrationFixture.defaultJsonPost();
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
        var formData = defaultRegistrationFixture.defaultJsonPost();

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
        var formData = defaultRegistrationFixture.defaultJsonPost();
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
        var formData = fixture.defaultJsonPost();
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
        var formData = namesOptionalRegistrationFixture.namesProvidedJsonPost();

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
        var formData = namesOptionalRegistrationFixture.namesOmittedJsonPost();

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
        var formData = namesDisabledRegistrationFixture.defaultJsonPost();

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
          }
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
});