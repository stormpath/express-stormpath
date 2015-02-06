'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var cheerio = require('cheerio');
var express = require('express');
var request = require('supertest');

var stormpath = require('../index');

describe('register', function() {
  it('should bind to /register by default', function(done) {
    var app = express();

    app.use(stormpath.init(app));

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
});
