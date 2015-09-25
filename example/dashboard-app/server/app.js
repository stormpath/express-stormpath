/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
var ExpressStormpath = require('express-stormpath');
var path = require('path');
// Setup server
var app = express();

app.use(ExpressStormpath.init(app,{
  website: true,
  web: {
    spaRoot: path.join(__dirname, '..','client','index.html')
  }
}));

var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;