.. _protect_api:

Secure the API
====================

Our skeleton application contains a simple API, it serves a list of things (you saw this when you ran ``grunt serve`` for the first time).  We will use Stormpath to secure this simple API


Add the Stormpath middleware
---------------------------

Find the file ``server/routes.js``

This file is attaching some routes to the Express application that is setup in ``server/app.js``

We want to initialize the Stormpath middleware and add it before our API declarion, so that the API will be automatically protected.

First things first, you need to require the SDK - place this at the top of the file::

    var stormpathExpressSdk = require('stormpath-sdk-express');

Then you want to create an instance of the Stormpath middleware.  You can
pass options, but in our case we are just going to make a simple call and
use all the default options.  Add this line before the ``module.exports`` statement::

    var spMiddleware = stormpathExpressSdk.createMiddleware();

Then inside the module.exports, before any other `app` statements::

    spMiddleware.attachDefaults(app);

This will attach the following route handlers to your Express app:

* ``POST /oauth/token`` (accepts the login form POST, returns an access token)
* ``POST /api/users`` (for creating new users)
* ``GET /api/users/current`` (for getting info about the current user, as permitted by the access token)
* ``GET /logout`` (for ending the current session, the access token is destroyed)

The last thing we need to do is secure the things endpoint.  Modify that line
to use the authentiate middleware::

    app.use('/api/things', spMiddleware.authenticate, require('./api/thing'));

Reload the app
---------------

Restart the server by running ``grunt serve`` again.  You should now see that
the features are no longer listed - this is because the endpoint fails to load
with a ``401 Unauthorized`` - you can see this by looking inside the web console
in your browser:

.. image:: _static/features-unauthorized.png


Our API is now protected from unauthorized, anonymous access.  In the next two sections we will show you how to create a registration form and a login form.  At that point you will be able to login and have access to the API.