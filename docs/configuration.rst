.. _configuration:


Configuration
=============

In the last section, we gathered our API credentials for the Stormpath API.
Now we'll configure our Express application to use them.

Now that we've got all the prerequisites out of the way, let's take a look at
some code!  Integrating Express-Stormpath into an application can take as little
as **1 minute**!


Environment Variables
---------------------

It is a best practice to store confidential information in environment
variables (*don't hard-code it into your application*). You should store your
confidential Stormpath information in environment variables.  You can do this
by running the following commands in the shell:

.. code-block:: bash

    export STORMPATH_CLIENT_APIKEY_ID=YOUR-ID-HERE
    export STORMPATH_CLIENT_APIKEY_SECRET=YOUR-SECRET-HERE
    export STORMPATH_APPLICATION_HREF=YOUR-APP-HREF

.. note::
    If you're on Windows, the command you need to use to set environment
    variables is:

    .. code-block:: bash

        set STORMPATH_CLIENT_APIKEY_ID=YOUR-ID-HERE
        set STORMPATH_CLIENT_APIKEY_SECRET=YOUR-SECRET-HERE
        set STORMPATH_APPLICATION_HREF=YOUR-APP-HREF

.. tip::

    You might also want to check out
    `autoenv <https://github.com/kennethreitz/autoenv>`_, a project that makes
    working with environment variables simpler for Linux / Mac / BSD users.

The examples above show you the 3 mandatory settings you need to configure to
make express-stormpath work.  These settings can be configured via environment
variables, or in a number of other ways.


Initialize Express-Stormpath
----------------------------

To initialize Express-Stormpath, you need to use the ``stormpath.init``
middleware and provide a configuration object.

Below is a minimal Express application which shows how you can import and
initialize the Stormpath middleware:

 .. code-block:: javascript

    var express = require('express');
    var stormpath = require('express-stormpath');

    var app = express();
    app.use(stormpath.init(app, {
      // Optional configuration options.
      website: true
    }));

    // Once Stormpath has initialized itself, start your web server!
    app.on('stormpath.ready', function () {
      app.listen(3000);
    });

The Stormpath middleware is what initializes Stormpath, grabs configuration
information, and manages sessions / user state.  It is the base of all
Express-Stormpath functionality.

.. note::
    The Stormpath middleware **must** always be the last initialized middleware,
    but must come **before** any custom route code that you want to protect
    with Stormpath.

Lastly, as of version **0.5.9** of this library -- if you're using Heroku you
don't need to specify your credentials or application at all -- these values
will be automatically populated for you.


Option Profiles
---------------

For most applications, you will want to enable the "website" option.  This will
configure the library to serve it's default views for login, registration, and
password reset.  This also configures the JSON API for those same features:

 .. code-block:: javascript

    app.use(stormpath.init(app, {
      website: true
    }));

If you do not need these routes (for example, you have an API servce that does not
serve traditional login and registration pages) you do not need the website profile.

Full documentation of the option profiles will be coming soon.  In the meantime, please
refer to this YAML configuration which shows you the default options:

https://github.com/stormpath/express-stormpath/blob/master/lib/config.yml


Logging
-------

By default, this library will create a `Winston`_ logger and use this for
logging error messages to standard output.

While actively developing your application, you may want to include the ``info``
level for debugging purposes:

.. code-block:: javascript

    app.use(stormpath.init(app, {
      debug: 'info, error'
    }));

If you want to supply your own Winston logger, you can do that as well:

.. code-block:: javascript

    var myLogger = new winston.Logger({ /* your winston options */});

    app.use(stormpath.init(app, {
      logger: myLogger
    }));

.. note::

  You can provide other types of loggers, so long as the logger implements the
  same interface as the Winston logger, providing methods such as ``info()``
  and ``error()``.

Stormpath Client Options
------------------------

When you initialize this library, it creates an instance of a Stormpath Client.
The Stormpath client is responsible for communicating with the Stormpath REST
API and is provided by the `Stormpath Node SDK`_.  You can pass options to the
Stormpath Client by adding them to the root of the configuration object that
you provide in your Express application.

For example, if you wish to enable the Redis caching feature of the
Stormpath Client::

  app.use(stormpath.init(app, {
    cacheOptions: {
      store: 'redis'
    },
    website: true
  }));

For a full reference of options, please see the Node SDK client documentation:

https://docs.stormpath.com/nodejs/api/client

If you would like to work directly with the client in your Express application,
you can fetch it from the app object like this::

    app.get('/secret', function (req, res) {
      var client = req.app.get('stormpathClient');

      // For example purposes only -- you probably don't want to actually expose
      // this information to your users =)
      client.getCurrentTenant(function (err, tenant) {
        if (err) {
          return res.status(400).json(err);
        }

        res.json(tenant);
      });
    });


Startup
-------

If you followed the step above, you will now have fully functional
registration, login, and logout functionality active on your site!  Your site
should be live on this URL:

http://localhost:3000

Don't believe me?  Test it out!  Start up your Express web server now, and I'll
walk you through the basics:

- Navigate to ``/register``.  You will see a registration page.  Go ahead and
  enter some information.  You should be able to create a user account.  Once
  you've created a user account, you'll be automatically logged in, then
  redirected back to the root URL (``/``, by default).
- Navigate to ``/logout``.  You will now be logged out of your account, then
  redirected back to the root URL (``/``, by default).
- Navigate to ``/login``.  You will see a login page.  You can now re-enter
  your user credentials and log into the site again.

Wasn't that easy?!

.. note::
    You probably noticed that you couldn't register a user account without
    specifying a sufficiently strong password.  This is because, by default,
    Stormpath enforces certain password strength rules on your Stormpath
    Directories.

    If you'd like to change these password strength rules (*or disable them*),
    you can do so easily by visiting the `Stormpath dashboard`_, navigating to
    your user Directory, then changing the "Password Strength Policy".


Single Page Applications
------------------------

This framework is designed to work with front-end frameworks like Angular and
React.  For each feature (login, registration) there is a JSON API for the
feature.  The JSON API is documented for each feature, please see the feature
list in the sidebar of this documentation.

In some cases you may need to specify the ``spa.view`` option.  This
is the absolute file path to the entry point for your SPA.  That option
would be defined like this::

    app.use(stormpath.init(app, {
      web: {
        spa: {
          enabled: true,
          view: path.join(__dirname, 'public', 'index.html')
        }
      }
    }));

This allows our framework to serve your SPA, for routes that this framework also
wants to handle. You need this option if the following are true:

 * Your SPA is using HTML5 history mode
 * You want the default feature routes, such as ``/login`` to
   serve your SPA
 * You don't want to use our default login and registration views

.. note::

  It is not yet possible to disable the default HTML views, but still retain the
  JSON API. We will be fixing this in a future release. This creates a problem
  for React Flux applications that want to use the `/login` route in their
  browser application, but not use our default HTML views.

  To work around the problem, you can change the `uri` of the route to a different
  URL than ``/login``.  For example:

  .. code-block:: javascript

    app.use(stormpath.init(app, {
      website: true,
      web: {
        login: {
          uri: '/api/login'
        }
      }
    }));

  Your browser code will need to make it's login POST to ``/api/login``

.. _Stormpath applications: https://api.stormpath.com/v#!applications
.. _Stormpath dashboard: https://api.stormpath.com/ui/dashboard
.. _Stormpath Node SDK: http://github.com/stormpath/stormpath-sdk-node
.. _Winston: https://github.com/winstonjs/winston
