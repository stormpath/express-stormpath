.. _sessions:

Sessions
===========


Browser-based Sessions
------------------

Express-Stormpath ships with a default, pre-configured session middleware by
default.  It is backed by an OAuth Acess tokens, see :ref:`authentication` for more
information.

.. note::
    Express-Stormpath's session management will not interfere with any existing
    session middleware you might have.  The sessions that Stormpath uses are
    exclusively used for Stormpath purposes, so it's safe you create your own
    separate sessions.

    This works by utilizing the Express `router`_.

If you'd like to use your own session middleware, you can set it up during the
Stormpath middleware initialization.  The only requirement is that your request
key for the session is ``session``.

You can do it this way::

    var session = require('express-session');

    // In this example we'll store our session state in a Redis server.
    var RedisStore = require('connect-redis')(session);

    var sessionMiddleware = session({
      store: new RedisStore(options),
      secret: 'this is very secret',
    });

    // Enable your session middleware for your app.
    app.use(sessionMiddleware);

    // Initialize Stormpath, and have it use your session middleware instead of
    // it's own.
    app.use(stormpath.init(app, {
      sessionMiddleware: sessionMiddleware,
    }));

.. note::
    Substituting your own session middleware in for the default is most likely a
    security concern -- please only do this if you absolutely know what you're
    doing and are sure you need to do it!  If you're not sure, please contact us
    directly to figure it out: support@stormpath.com


Configurable Expiration
--------------------------------------

For browser-based clients, you can control the idle time and expiration time
of the session by modifying the OAuth Policy for the Stormpath Application
that you are using.

To change these settings, you should invoke a node client directly::

    var stormpath = require('stormpath'); // Using the Node SDK directly
    var client = new stormpath.Client();

    client.getApplication('your app href',function(err,application){
        application.getOAuthPolicy(function(err,policy){
            policy.accessTokenTtl = "PT1D"; // one day
            policy.save();
        });
    });



