'use strict';

var async = require('async');
var assert = require('assert');
var express = require('express');
var request = require('supertest');

var bodyParser = require('../../lib/helpers').bodyParser;

describe('bodyParser', function () {
  var app, server, host;

  before(function (done) {
    app = express();

    server = app.listen(function () {
      var address = server.address().address === '::' ? 'http://localhost' : server.address().address;

      address = address === '0.0.0.0' ? 'http://localhost' : address;
      host = address + ':' + server.address().port;

      done();
    });
  });

  describe('forceDefaultBody middleware', function () {
    it('can force default body on request', function (done) {
      var resultRequestBody;

      app.get('/test/default-body', bodyParser.forceDefaultBody(), function (req, res, next) {
        resultRequestBody = req.body;
        res.status(200).end();
        next();
      });

      request(host)
        .get('/test/default-body')
        .expect(200)
        .end(function () {
          assert.equal(typeof resultRequestBody, 'object');
          assert.deepEqual(resultRequestBody, {});
          done();
        });
    });
  });

  describe('form middlware', function () {
    it('can handle form request', function (done) {
      var resultRequestBody;

      app.get('/test/form', bodyParser.form(), function (req, res, next) {
        resultRequestBody = req.body;
        res.status(200).end();
        next();
      });

      request(host)
        .get('/test/form')
        .send('test=abc')
        .expect(200)
        .end(function () {
          assert.equal(typeof resultRequestBody, 'object');
          assert.deepEqual(resultRequestBody, { test: 'abc' });
          done();
        });
    });
  });

  describe('formOrJson middleware', function () {
    it('can handle form and json requests', function (done) {
      var resultRequestBody;

      app.post('/test/form-and-json', bodyParser.formOrJson(), function (req, res, next) {
        resultRequestBody = req.body;
        res.status(200).end();
        next();
      });

      async.series([
        function (callback) {
          request(host)
            .post('/test/form-and-json')
            .send('test1=abc1')
            .expect(200)
            .end(function () {
              assert.equal(typeof resultRequestBody, 'object');
              assert.deepEqual(resultRequestBody, { test1: 'abc1' });
              callback();
            });
        },
        function (callback) {
          request(host)
            .post('/test/form-and-json')
            .type('json')
            .send({ test2: 'abc2' })
            .expect(200)
            .end(function () {
              assert.equal(typeof resultRequestBody, 'object');
              assert.deepEqual(resultRequestBody, { test2: 'abc2' });
              callback();
            });
        }
      ], done);
    });
  });
});