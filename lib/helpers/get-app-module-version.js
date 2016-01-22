'use strict';

var fs = require('fs');
var path = require('path');

var cachedModulePaths = {};
var globalModulesPath = process.env.NODE_PATH;
var appFilePath = require.main.filename;
var appModulesPath = path.join(path.dirname(fs.realpathSync(appFilePath)), 'node_modules');

function getApplicationModulePath(name) {
  if (name in cachedModulePaths) {
    return cachedModulePaths[name];
  }

  var result = false;

  var modulePaths = [
    path.join(appModulesPath, name)
  ];

  if (globalModulesPath) {
    modulePaths.push(path.join(globalModulesPath, name));
  }

  while (modulePaths.length) {
    var modulePath = modulePaths.shift();
    if (fs.existsSync(modulePath)) {
      result = modulePath;
      break;
    }
  }

  cachedModulePaths[name] = result;

  return result;
}

/**
 * Gets the version of a module loaded at application level (process).
 *
 * @method
 * @private
 *
 * @param {string} name - Name of the module that you want to resolve the version for.
 *
 * @return {string} Module version, or false if the module couldn't be found.
 */
module.exports = function getApplicationModuleVersion(name) {
  var modulePath = getApplicationModulePath(name);

  if (modulePath) {
    var loadedModule = require(path.join(modulePath, 'package.json'));
    if (loadedModule) {
      return loadedModule.version;
    }
  }

  return false;
};
