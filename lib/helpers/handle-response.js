'use strict';

/**
 * Scope in which a request handler is executed.
 *
 * @method
 * @private
 *
 * @param {Object} req - HTTP request.
 * @param {Object} res - HTTP response.
 * @param {function} accept - Callback which accepts the request.
 * @param {function} reject - Callback which rejects the request.
 * @param {function} pass - Callback which pass on the request.
 */
function HandlerScope(req, res, accept, reject, pass) {
  this.req = req;
  this.res = res;
  this.accept = accept;
  this.reject = reject;
  this.pass = pass;
}

/**
 * Accept the request. This ends the request.
 */
HandlerScope.prototype.accept = function accept(result, statusCode) {
  this.accept.apply(null, [result, statusCode]);
};

/**
 * Reject the request. This ends the request in an error.
 */
HandlerScope.prototype.reject = function reject(err, statusCode) {
  this.reject.apply(null, [err, statusCode]);
};

/**
 * Pass on the request.
 */
HandlerScope.prototype.pass = function pass() {
  this.pass.apply(null);
};

/**
 * Determine whether or not this is a GET request.
 */
HandlerScope.prototype.isGetRequest = function isGetRequest() {
  return this.req.method === 'GET';
};

/**
 * Determine whether or not this is a PUT request.
 */
HandlerScope.prototype.isPutRequest = function isPutRequest() {
  return this.req.method === 'PUT';
};

/**
 * Determine whether or not this is a POST request.
 */
HandlerScope.prototype.isPostRequest = function isPostRequest() {
  return this.req.method === 'POST';
};

/**
 * Determine whether or not this is a DELETE request.
 */
HandlerScope.prototype.isDeleteRequest = function isDeleteRequest() {
  return this.req.method === 'DELETE';
};

/**
 * Handles the response from a controller.
 *
 * @method
 * @private
 *
 * @param {Object} req - HTTP request.
 * @param {Object} res - HTTP response.
 * @param {function} next - Next callback.
 * @param {Object} handlers - Object where the key is the content type to handle.
 * @param {function} callback - Callback that is called when the request is handled (optional).
 */
function handleResponse(req, res, next, handlers, callback) {
  callback = callback || function nop() {};

  var config = req.app.get('stormpathConfig');
  var accepted = req.accepts(config.web.produces);

  if (!accepted || !(accepted in handlers)) {
    next();
    callback();
  }

  var handler = handlers[accepted];

  function acceptHandler(result, statusCode) {
    if (statusCode) {
      res.status(statusCode);
    }

    if (accepted === 'application/json' && result) {
      res.json(result);
    }

    callback();
  }

  function rejectHandler(err, statusCode) {
    res.status(statusCode || err.httpErrorCode || 400);

    if (accepted === 'application/json') {
      var errorMessage = 'Unknown error. Please contact support.';

      if (err) {
        errorMessage = err.userMessage || err.message;
      }

      res.json({ error: errorMessage });
    }

    res.end();

    callback(err);
  }

  function passHandler() {
    next();
    callback();
  }

  handler.apply(new HandlerScope(req, res, acceptHandler, rejectHandler, passHandler));
}

module.exports = handleResponse;