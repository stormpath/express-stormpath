.. _configuration:


Configuration
=============

This module provides several options that allow you to customize the authentication
features of your Express application. We will cover the major options in this
section, and more specific options in later sections of this guide.

If you would like a list of all available options, please refer to the
`Web Configuration Defaults`_ file in the library. This YAML file has comments
which describe each option and the value represents the option default.


Environment Variables
---------------------

It is a best practice to store confidential information in environment
variables (*don't hard-code it into your application*). You should store your
confidential Stormpath information in environment variables.  You can do this
by running the following commands in the shell:

.. code-block:: bash

    export STORMPATH_CLIENT_APIKEY_ID=YOUR_ID_HERE
    export STORMPATH_CLIENT_APIKEY_SECRET=YOUR_SECRET_HERE
    export STORMPATH_APPLICATION_HREF=YOUR_APP_HREF

.. note::
    If you're on Windows, the command you need to use to set environment
    variables is:

    .. code-block:: bash

        set STORMPATH_CLIENT_APIKEY_ID=YOUR_ID_HERE
        set STORMPATH_CLIENT_APIKEY_SECRET=YOUR_SECRET_HERE
        set STORMPATH_APPLICATION_HREF=YOUR_APP_HREF

The examples above show you the 3 mandatory settings you need to configure to
make express-stormpath work.  These settings can be configured via environment
variables, or in a number of other ways.

.. note::

    If you're using Heroku you don't need to specify the credentials or
    your application -- these values will be automatically provided for you.

.. tip::

    You might also want to check out
    `autoenv <https://github.com/kennethreitz/autoenv>`_, a project that makes
    working with environment variables simpler for Linux/Mac/BSD users.

Inline Options
----------------

If you wish to define your variables as inline options (not recommended!) you
can do so like this:

.. code-block:: javascript

  app.use(stormpath.init(app, {
    apiKey: {
      id: 'YOUR_ID_HERE',
      secret: 'YOUR_SECRET_HERE'
    },
    application: {
      href: `YOUR_APP_HREF`
    }
  }));

.. _default_features:

Default Features
----------------

When you add Stormpath to your application using ``app.use(stormpath.init(app))``,
our module will automatically add the following routes to your application:

+--------------+-------------------------------------------------------------+---------------------------+
| URI          | Purpose                                                     | Documentation             |
+==============+=============================================================+===========================+
| /forgot      | Request a password reset link.                              | :ref:`password_reset`     |
+--------------+-------------------------------------------------------------+---------------------------+
| /login       | Login to your application with username and password.       | :ref:`login`              |
+--------------+-------------------------------------------------------------+---------------------------+
| /logout      | Accepts a POST request, and destroys the login session.     | :ref:`logout`             |
+--------------+-------------------------------------------------------------+---------------------------+
| /me          | Returns a JSON representation of the current user.          | :ref:`me_api`             |
+--------------+-------------------------------------------------------------+---------------------------+
| /oauth/token | Issue OAuth2 access and refresh tokens.                     | :ref:`authentication`     |
+--------------+-------------------------------------------------------------+---------------------------+
| /register    | Create an account within your application.                  | :ref:`registration`       |
+--------------+-------------------------------------------------------------+---------------------------+
| /reset       | Reset an account password, from a password reset link.      | :ref:`password_reset`     |
+--------------+-------------------------------------------------------------+---------------------------+
| /verify      | Verify a new account, from a email verification link.       | :ref:`email_verification` |
+--------------+-------------------------------------------------------------+---------------------------+

Each featue has its own options, please refer to the documentation of each
feature. If you want to disable specific features, continue to the next
section.

Disabling Features
------------------

We enable many features by default, but you might not want to use all of them.
For example, if you wanted to disable all the default features, you would use
this configuration:

 .. code-block:: javascript

    app.use(stormpath.init(app, {
      web: {
        login: {
          enabled: false
        },
        logout: {
          enabled: false
        },
        me: {
          enabled: false
        },
        oauth2: {
          enabled: false
        }
        register: {
          enabled: false
        }
      }
    }));



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
    }
  }));

For a full reference of options, please see the
`Node SDK Client Documentation`_.

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


Stormpath Application
---------------------

When you configured Stormpath, you specified the Stormpath Application that you
want to use (you did this by providing the HREF of the application).  This library
will fetch the application and use it to perform all login, registration,
verification and password reset functions.

The Stormpath Application allows you to do a lot of other work, such as manually
creating accounts and modifying your OAuth policy - plus much more!  If you want
to work with the Stormpath Application, you can reference its object like this:

.. code-block:: javascript

    app.get('/home', stormpath.getUser, function (req, res) {
      var stormpathApplication = req.app.get('stormpathApplication');
    });

This object is provided by the `Stormpath Node SDK`_ and is
`documented here <http://docs.stormpath.com/nodejs/api/application>`_.

.. note::

  The value ``stormpathApplication`` won't be available until the
  ``app.on('stormpath.ready')`` event has been fired.  As such, you should wait
  for this event or place the ``stormpath.getUser`` middleware in front of your
  custom middlware, as it will also wait for this event to fire.

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

 * Your SPA is using HTML5 history mode.
 * You want the default feature routes, such as ``/login`` to serve your SPA.
 * You don't want to use our default login and registration views, you want your
   SPA to render those client-side.

.. note::

  You can disable our HTML views entirely, this is useful if you simply want to
  use our JSON API with your customized front-end application.  Use this
  configuration to remove HTML from the content type list:

  .. code-block:: javascript

    app.use(stormpath.init(app, {
      web: {
        produces: ['application/json']
      }
    }));


Logging
-------

By default, this library will create a `Winston`_ logger and use this for
logging error messages to standard output.

While actively developing your application, you may want to increase to the
``info`` level for debugging purposes:

.. code-block:: javascript

    app.use(stormpath.init(app, {
      debug: 'info'
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

.. _Node SDK Client Documentation: https://docs.stormpath.com/nodejs/api/client
.. _Winston: https://github.com/winstonjs/winston
.. _Web Configuration Defaults: https://github.com/stormpath/express-stormpath/blob/master/lib/config.yml
.. _Stormpath applications: https://api.stormpath.com/v#!applications
.. _Stormpath dashboard: https://api.stormpath.com/ui/dashboard
.. _Stormpath Node SDK: http://github.com/stormpath/stormpath-sdk-node
