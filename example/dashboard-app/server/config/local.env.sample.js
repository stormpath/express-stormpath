'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
  DOMAIN:           'http://localhost:9000',
  SESSION_SECRET:   'dashboardapp-secret',

  // Control debug level for modules using visionmedia/debug
  DEBUG: '',
  STORMPATH_API_KEY_ID: 'YOUR_KEY_ID',
  STORMPATH_API_KEY_SECRET: 'YOUR_KEY_SECRET',
  STORMPATH_APP_HREF: 'YOUR_APP_HREF'
};
