'use strict';

function MockRequest(method, app, acceptContentType) {
  this.method = method;
  this.app = app;
  this._acceptContentType = acceptContentType;
}

MockRequest.prototype.accepts = function (contentTypes) {
  if (contentTypes.indexOf(this._acceptContentType) === -1) {
    return false;
  }

  return this._acceptContentType;
};

module.exports = MockRequest;