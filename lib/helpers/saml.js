'use strict';

var stormpath = require('stormpath');
var SamlIdpUrlBuilder = stormpath.SamlIdpUrlBuilder;

module.exports = function initiateSamlAuth(application, callback) {
  var builder = new SamlIdpUrlBuilder(application);

  builder.build(callback);
};
