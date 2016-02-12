'use strict';

function MockResponse() {
}

MockResponse.prototype.status = function () {
};

MockResponse.prototype.json = function () {
};

MockResponse.prototype.end = function () {
};

module.exports = MockResponse;