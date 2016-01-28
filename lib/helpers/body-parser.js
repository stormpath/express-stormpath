'use strict';

var qs = require('qs');
var bytes = require('bytes');
var anyBody = require('body/any');
var formBody = require('body/form');

var defaultSizeLimit = '200kb';

function queryStringParser(text, callback) {
  callback(null, qs.parse(text));
}

function handleBodyFn(options, bodyFn) {
  options = options || {};

  options.querystring = { parse: queryStringParser };
  options.limit = bytes.parse(options.limit || defaultSizeLimit);

  return function (req, res, next) {
    // If the body is already parsed, by e.g. body-parser, then skip parsing.
    if (req.body !== undefined) {
      return next();
    }

    bodyFn(req, res, options, function (err, parsedBody) {
      req.body = parsedBody || req.body || {};
      next();
    });
  };
}

module.exports = {
  /**
   * Middleware that forces a default
   * req.body object (null object).
   */
  forceDefaultBody: function () {
    return function forceDefaultBodyMiddleware(req, res, next) {
      req.body = req.body || {};
      next();
    };
  },

  /**
   * Middleware for parsing a form (query string)
   * encoded request body.
   */
  form: function formParserMiddleware(options) {
    return handleBodyFn(options, formBody);
  },

  /**
   * Middleware for parsing either a form
   * (query string) or JSON encoded request body.
   */
  formOrJson: function formOrJsonParserMiddleware(options) {
    return handleBodyFn(options, anyBody);
  }
};