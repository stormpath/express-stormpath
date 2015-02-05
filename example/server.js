'use strict';

/*
  This Express.js app will serve the client assets for the demo
  Angular app.  It also serves as a backend API for the
  Angular app.  You will need to set your Stormpath API Keys
  and application href below.

  We take advantage of Routers in Express 4.x, they are a great
  way of organizing the differnt partsof your server.
 */

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var stormpathSdkExpress = require('stormpath-sdk-express');

var path = require('path');
var app = express();

var spMiddleware = stormpathSdkExpress.createMiddleware({
  appHref: 'YOUR_APP_HREF',
  apiKeyId: 'YOUR_API_KEY_ID',
  apiKeySecret: 'YOUR_API_KEY_SECRET'
});

/*
  This router will serve the demo app, we pull those files from the build/
  directory and the example/app directory.  We will also attach the
  storpath middleware to this router - this will force authentication
  on all the non-public routes. The order matters here: we hook up
  the public assets for the Angular app before we hook up the
  stormpath middleware.
 */

var demoRouter = express.Router();

demoRouter.use(bodyParser.json());

demoRouter.use(cookieParser());

demoRouter.use(express.static(path.join(__dirname, 'app')));

demoRouter.use(express.static(path.join(__dirname, '..','build')));

demoRouter.use(spMiddleware);

demoRouter.get('/api/users/current',function(req,res){
  res.json(req.user);
});


/*
  This router will serve the documentation from the tmp directory
*/

var docsRouter = express.Router();

docsRouter.use(express.static(path.join(__dirname, '..', '.tmp','site')));


/*
  Now that we have our routers configured we will hook them
  up to our epxress app.  We'll hook up the docs router at /docs
  and the demo router at the / root of the server
 */

app.use(require('connect-livereload')());
app.use('/docs',docsRouter);
app.use('/',demoRouter);

app.listen(process.env.PORT || 9000);