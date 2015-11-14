'use strict';

var qs = require('qs');
var getRawBody = require('raw-body');

function jsonParser(req, res, next) {
  // return bodyParser.json({ limit: '200kb' })(req, res, next);
  var type = req.headers && req.headers['content-type'];
  if (type !== 'application/json') {
    return next();
  }
  getRawBody(req, function (err, string) {
    if (err) {
      return next(err);
    }
    try {
      req.body = JSON.parse(string.toString());
      next();
    } catch (e) {
      req.body = {};
      next();
    }
  });
}

function formEncodedParser(req, res, next) {
  // return bodyParser.urlencoded({ extended: true })(req, res, next);
  //
  var type = req.headers && req.headers['content-type'];
  if (type !== 'application/x-www-form-urlencoded') {
    req.body = {};
    return next();
  }
  getRawBody(req, function (err, string) {
    if (err) {
      return next(err);
    }
    req.body = qs.parse(string.toString()) || {};
    next();
  });
}

module.exports = {
  jsonParser: jsonParser,
  formEncodedParser: formEncodedParser
};