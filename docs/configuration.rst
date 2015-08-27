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
Most Node.js applications exepct your confidential information to be
exposed by the environment (not hard-coded in the application).  You
should export your Stormpath information by running this in the shell:

 .. code-block:: bash

    export STORMPATH_CLIENT_APIKEY_ID=YOUR-ID-HERE
    export STORMPATH_CLIENT_APIKEY_SECRET=YOUR-SECRET-HERE
    export STORMPATH_CLIENT_APPLICATION_HREF=YOUR-APP-HREF

.. note::
    If you're on Windows, that will look like::

        set STORMPATH_CLIENT_APIKEY_ID=YOUR-ID-HERE


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
      /* optional configuration options */
      web: true
    }));

    app.listen(3000);

The Stormpath middleware is what initializes Stormpath, grabs configuration
information, and manages sessions / user state.  It is the base of all
Express-Stormpath functionality.

.. note::
    The Stormpath middleware **must** always be the last initialized middleware,
    but must come **before** any custom route code.  If not, you may experience
    odd side effects.

Lastly, as of version **0.5.9** of this library -- if you're using Heroku you
don't need to specify your credentials or application at all -- these values
will be automatically populated for you.


Option Profiles
---------------

Web server or API server? Both?  You can opt into one or both, and we'll
automatically  attach the required middleware to your application.  The options
are:

 .. code-block:: javascript

    {
        "website": true,  // serves HTML login pages
        "api": true       // enabled OAuth client credentials and token authentication
    }

Full documentation of the options will be coming soon.  In the meantime, please
refer to this JSON config which shows you the default options:

https://github.com/stormpath/stormpath-sdk-spec/blob/master/specifications/config.json


Stormpath Client Options
------------------------

When you initialize this library, it creates an instance of a Stormpath Client.
This comes from the `Stormpath Node SDK`_.  The client options allow you to
control options such as which caching engine to use (in-memory, by default).  For
a full reference of options, please see this link:

https://docs.stormpath.com/nodejs/api/client

If you would like to work directly with the client in your Express application,
you can fetch it from the app object like this::

    app.get('/secret', function(req, res) {
      var client = req.app.get('stormpathClient');

      /*
        For example purposes - don't actually expose your tenant info to
        your users :)
       */

      client.getCurrentTenant(function(err,tenant){
        if(err){
          res.status(400).json(err);
        }else{
          res.json(tenant);
        }
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


.. _Stormpath applications: https://api.stormpath.com/v#!applications
.. _Stormpath dashboard: https://api.stormpath.com/ui/dashboard
.. _Stormpath Node SDK: http://github.com/stormpath/stormpath-sdk-node
