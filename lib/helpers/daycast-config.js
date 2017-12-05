var fs = require('fs');
module.exports = function daycastConfig() {
  var config_json;
  try {
    config_json = fs.readFileSync('service-deps/daycast-config.json', {encoding: 'utf8'});
  }
  catch(err) {
    try {
      config_json = fs.readFileSync('deps/daycast-config.json', {encoding: 'utf8'});
    }
    catch(err) {
      throw new Error('Unable to find [service-]deps/daycast-config.json in: ' + process.cwd());
    }
  }
  return JSON.parse(config_json);
};
