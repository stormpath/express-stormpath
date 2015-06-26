'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var async = require('async');
var cheerio = require('cheerio');
var express = require('express');
var request = require('supertest');
var uuid = require('uuid');

var helpers = require('../helpers');
var stormpath = require('../../index');

describe('register', function() {
  var stormpathApplication;
  var stormpathClient;

  before(function() {
    stormpathClient = helpers.createClient();
  });

  beforeEach(function(done) {
    helpers.createApplication(stormpathClient, function(err, app) {
      if (err) return done(err);
      stormpathApplication = app;
      done();
    });
  });

  afterEach(function(done) {
    helpers.destroyApplication(stormpathApplication, done);
  });

  it('should bind to /register if enabled', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      client: {
        apiKey: {
          id: process.env.STORMPATH_API_KEY_ID,
          secret: process.env.STORMPATH_API_KEY_SECRET
        },
      },
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true
        }
      }
    }));

    request(app)
      .get('/register')
      .expect(200)
      .end(function(err, res) {
        done(err);
      });
  });

  it('should return a json error if the accept header supports json and the content type we post is json', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      client: {
        apiKey: {
          id: process.env.STORMPATH_API_KEY_ID,
          secret: process.env.STORMPATH_API_KEY_SECRET
        }
      },
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true
        }
      }
    }));

    setTimeout(function() {
      request(app)
        .post('/register')
        .type('json')
        .set('Accept', 'application/json')
        .expect(400)
        .end(function(err, res) {
          if (err) return done(err);

          var json = JSON.parse(res.text);
          if (!json.error) return done(new Error('No JSON error returned.'));
          done();
        });
    }, 5000);
  });

  it('should return a successful json response with a status field if the accept header supports json and the content type we post is json and we supply all user data fields', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      client: {
        apiKey: {
          id: process.env.STORMPATH_API_KEY_ID,
          secret: process.env.STORMPATH_API_KEY_SECRET
        }
      },
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true
        }
      }
    }));

    setTimeout(function() {
      request(app)
        .post('/register')
        .type('json')
        .send({
          givenName: uuid.v4(),
          surname: uuid.v4(),
          email: uuid.v4() + '@test.com',
          password: uuid.v4() + uuid.v4().toUpperCase() + '!'
        })
        .set('Accept', 'application/json')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          var json = JSON.parse(res.text);
          if (!json.status) return done(new Error('No JSON status fields returned.'));
          done();
        });
    }, 5000);
  });

  it('should return a successful json response with a status field if the accept header supports json and the content type we post is form data and we supply all user data fields', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      client: {
        apiKey: {
          id: process.env.STORMPATH_API_KEY_ID,
          secret: process.env.STORMPATH_API_KEY_SECRET
        }
      },
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true
        }
      }
    }));

    setTimeout(function() {
      request(app)
        .post('/register')
        .type('form')
        .send({
          givenName: uuid.v4(),
          surname: uuid.v4(),
          email: uuid.v4() + '@test.com',
          password: uuid.v4() + uuid.v4().toUpperCase() + '!'
        })
        .set('Accept', 'application/json')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          var json = JSON.parse(res.text);
          if (!json.status) return done(new Error('No JSON status fields returned.'));
          done();
        });
    }, 5000);
  });

  it('should bind to another URL if specified', function(done) {
    var app = express();

    app.use(stormpath.init(app, {
      client: {
        apiKey: {
          id: process.env.STORMPATH_API_KEY_ID,
          secret: process.env.STORMPATH_API_KEY_SECRET
        }
      },
      application: {
        href: stormpathApplication.href
      },
      web: {
        register: {
          enabled: true,
          uri: '/newregister'
        }
      }
    }));

    async.series([
      function(cb) {
        request(app)
          .get('/newregister')
          .expect(200)
          .end(function(err, res) {
            if (err) return cb(err);
            cb();
          });
      },
      function(cb) {
        request(app)
          .get('/register')
          .expect(404)
          .end(function(err, res) {
            if (err) return cb(err);
            cb();
          });
      }
    ], function(err) {
      if (err) return done(err);
      done();
    });
  });

  // TODO bring back this test after we finalize our config for form fields

  // it('should not require givenName if requireGivenName is false', function(done) {
  //   var app = express();
  //   var agent = request.agent(app);

  //   app.use(stormpath.init(app, {
  //     apiKeyId:         process.env.STORMPATH_API_KEY_ID,
  //     apiKeySecret:     process.env.STORMPATH_API_KEY_SECRET,
  //     application:      stormpathApplication.href,
  //     requireGivenName: false,
  //   }));

  //   agent
  //     .get('/register')
  //     .expect(200)
  //     .end(function(err, res) {
  //       if (err) {
  //         return done(err);
  //       }

  //       var $ = cheerio.load(res.text);
  //       var email = uuid.v4() + '@test.com';

  //       setTimeout(function() {
  //         agent
  //           .post('/register')
  //           .type('form')
  //           .send({ surname: uuid.v4() })
  //           .send({ email: email })
  //           .send({ password: uuid.v4() + uuid.v4().toUpperCase() + '!' })
  //           .end(function(err, res) {
  //             if (err) {
  //               return done(err);
  //             }

  //             stormpathApplication.getAccounts({ email: email }, function(err, accounts) {
  //               if (err) {
  //                 return done(err);
  //               }

  //               accounts.each(function(account, cb) {
  //                 if (account.email === email) {
  //                   return done();
  //                 }

  //                 cb();
  //               }, function() {
  //                 done(new Error('Account not created.'));
  //               });
  //             });
  //           });
  //       }, 5000);
  //     });
  // });
  //

  // TODO bring back this test after we finalize our config for form fields

  // it('should not require surname if requireSurname is false', function(done) {
  //   var app = express();
  //   var agent = request.agent(app);

  //   app.use(stormpath.init(app, {
  //     apiKeyId:         process.env.STORMPATH_API_KEY_ID,
  //     apiKeySecret:     process.env.STORMPATH_API_KEY_SECRET,
  //     application:      stormpathApplication.href,
  //     requireSurname:   false,
  //   }));

  //   agent
  //     .get('/register')
  //     .expect(200)
  //     .end(function(err, res) {
  //       if (err) {
  //         return done(err);
  //       }

  //       var $ = cheerio.load(res.text);
  //       var email = uuid.v4() + '@test.com';

  //       setTimeout(function() {
  //         agent
  //           .post('/register')
  //           .type('form')
  //           .send({ givenName: uuid.v4() })
  //           .send({ email: email })
  //           .send({ password: uuid.v4() + uuid.v4().toUpperCase() + '!' })
  //           .end(function(err, res) {
  //             if (err) {
  //               return done(err);
  //             }

  //             stormpathApplication.getAccounts({ email: email }, function(err, accounts) {
  //               if (err) {
  //                 return done(err);
  //               }

  //               accounts.each(function(account, cb) {
  //                 if (account.email === email) {
  //                   return done();
  //                 }

  //                 cb();
  //               }, function() {
  //                 done(new Error('Account not created.'));
  //               });
  //             });
  //           });
  //       }, 5000);
  //     });
  // });
});
