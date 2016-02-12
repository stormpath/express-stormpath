'use strict';

function MockApp(mockConfig) {
  this._mockConfig = mockConfig;
}

MockApp.prototype.get = function (key) {
  if (key !== 'stormpathConfig') {
    return false;
  }

  return this._mockConfig;
};

module.exports = MockApp;