.. _protect_api:

Configure the Server
====================

In the previous section, :ref:`create_new_project`, we created a simple
Express.js and installed the `Stormpath Express Module`_.  We are going to use that
SDK to secure the API endpoints in the Express server.


Setting Environment Variables
------------------------------------

The `Stormpath Express Module`_ needs the API Key and Application information that
we collected in the section :ref:`create_tenant`.  We will provide this
information to the SDK by exporting it to the environment.


You can manually export the values to the environment by using the ``export``
or ``set`` commands in your terminal.

**Unix/Linux/Mac**::

  export STORMPATH_CLIENT_APIKEY_ID=xxxx
  export STORMPATH_CLIENT_APIKEY_SECRET=xxxx
  export STORMPATH_APPLICATION_HREF=xxxx

**Windows**::

  set STORMPATH_CLIENT_APIKEY_ID=xxxx
  set STORMPATH_CLIENT_APIKEY_SECRET=xxxx
  set STORMPATH_APPLICATION_HREF=xxxx



Require the Stormpath Module
---------------------------

Open the file ``server/app.js``.  This file is the entry point for our API
server, it will run the server.

We want to initialize the Stormpath middleware and add it before our API
declaration, so that the API will be automatically protected.

First things first, you need to require the SDK - place this at the top of the
file, under the other require statements::

    var ExpressStormpath = require('express-stormpath');

We're also going to use the ``path``, so you should require that as well::

   var path = require('path');

Then you want to create an instance of the Stormpath middleware.  You can pass
options, but in our case, we are just going to make a simple call and use all
the default options.  Add this line after the ``var app = express();`` statement::

    app.use(ExpressStormpath.init(app,{
      website: true,
      web: {
        spaRoot: path.join(__dirname, '..','client','index.html')
      }
    }));

That block of code will attach Stormpath to your Express application, and let
Stormpath know where the root of your Angular application is (the folder
where all of the Angular assets live)

Open the file ``server/routes.js``.

This file is attaching some routes to the Express application that is setup in
``server/app.js``.  You'll want to require ``express-stormpath`` again, and then
use it to secure your API::

    var ExpressStormpath = require('express-stormpath');

    // ..

    app.use('/api/things', ExpressStormpath.apiAuthenticationRequired, require('./api/thing'));

Reload the App
---------------

Restart the server by running ``grunt serve`` again.  You should now see that
the features are no longer listed - this is because the endpoint fails to load
with a ``401 Unauthorized`` - you can see this by looking inside the web console
in your browser:

.. image:: _static/features-unauthorized.png


Our API is now protected from unauthorized, anonymous access.  In the next two
sections, we will show you how to create a registration form and a login form.
At that point, you will be able to login and have access to the API.

.. _Configuration and Config Vars: https://devcenter.heroku.com/articles/config-vars
.. _Stormpath Express Module: https://github.com/stormpath/stormpath-express