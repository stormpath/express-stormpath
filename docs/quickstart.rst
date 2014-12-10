.. _quickstart:


Quickstart
==========

Now that we've got all the prerequisites out of the way, let's take a look at
some code!  Integrating Express-Stormpath into an application can take as little
as **1 minute**!


Initialize Express-Stormpath
----------------------------

To initialize Express-Stormpath, you need to use the ``stormpath.init``
middleware and provide some settings.

Below is a minimal Express application which shows how you can import and
initialize the Stormpath middleware::

    var express = require('express');
    var stormpath = require('express-stormpath');

    var app = express();
    app.use(stormpath.init(app, {
        apiKeyFile: '/path/to/apiKey.properties',
        application: 'https://api.stormpath.com/v1/applications/xxx',
        secretKey: 'some_long_random_string',
    }));

    app.listen(3000);

The Stormpath middleware is what initializes Stormpath, grabs configuration
information, and manages sessions / user state.  It is the base of all
Express-Stormpath functionality.

The ``apiKeyFile`` option takes an absolute path to the ``apiKey.properties``
file you downloaded in the previous section.  If you don't specify this setting,
the library will try to load this file automatically from your current
directory, as well as from ``~/.stormpath/apiKey.properties``.

The ``application`` option requires you to specify your Stormpath Application
href, which can be found under your Application on the `Stormpath Applications`_
dashboard page.  If you have created a Stormpath application previously, you
don't need to specify this at all -- it will use your application automatically.

The ``secretKey`` option should be a long, random string that is NOT checked
into your source code.  This is used to secure user sessions.  Make sure this
isn't guessable!  If you don't set this value, a random key will be generated
for you.  Please note that this is a BAD idea for production apps, as each time
your web server restarts your users will be forced to re-log into their
accounts.

If you'd prefer to specify your API credentials without using an
``apiKey.properties`` file, you can also do that easily by setting the following
two environment variables:

- ``STORMPATH_API_KEY_ID=xxx`` (*your Stormpath API key ID*)
- ``STORMPATH_API_KEY_SECRET=xxx`` (*your Stormpath API key secret*)

If you do this, you don't have to specify any credential configuration when
initializing the Stormpath middleware::

    var express = require('express');
    var stormpath = require('express-stormpath');

    var app = express();
    app.use(stormpath.init(app, {
        application: 'https://api.stormpath.com/v1/applications/xxx',
        secretKey: 'some_long_random_string',
    }));

    app.listen(3000);


.. note::
    The Stormpath middleware **must** always be the last initialized middleware,
    but must come **before** any custom route code.  If not, you may experience
    odd side effects.

Lastly, as of version **0.5.9** of this library -- if you're using Heroku you
don't need to specify your credentials or application at all -- these values
will be automatically populated for you.


Testing It Out
--------------

If you followed the step above, you will now have fully functional
registration, login, and logout functionality active on your site!

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
