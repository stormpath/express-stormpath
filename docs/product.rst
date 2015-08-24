Product Guide
=============

This product guide covers more advanced Express-Stormpath usage.  You can
selectively jump around from topic-to-topic to discover all the neat features
that Express-Stormpath provides!


Use Facebook Login
------------------

Now that we've covered the basics: let's add Facebook Login support to your app!
Stormpath makes it very easy to support social login with Facebook.

In the next few minutes I'll walk you through *everything* you need to know to
support Facebook login with your app.


Create a Facebook App
.....................

The first thing you need to do is log into the `Facebook Developer Site`_ and
create a new Facebook App.

You can do this by visiting the `Facebook Developer Site`_ and click the "Apps"
menu at the top of the screen, then select the "Create a New App" button.  You
should see something like the following:

.. image:: /_static/facebook-new-project.png

Go ahead and pick a "Display Name" (usually the name of your app), and choose a
category for your app.  Once you've done this, click the "Create App" button.


Specify Allowed URLs
....................

The next thing we need to do is tell Facebook what URLs we'll be using Facebook
Login from.

From the app dashboard page you're on, click the "Settings" tab in the left
menu, then click the "Add Platform" button near the bottom of the page.  When
prompted, select "Website" as your platform type.

In the "Site URL" box, enter your private and public root URLs.  This should be
something like ``"http://localhost:3000"`` or ``"http://mysite.com"``.  *If you
want to allow Facebook Login from multiple URLs (local development, production,
etc.) you can just click the "Add Platform" button again and enter another URL.*

Lastly, click the "Save Changes" button to save the changes.

Your settings should now look something like this:

.. image:: /_static/facebook-url-settings.png


Create a Facebook Directory
...........................

Next, we need to input the Facebook app credentials into Stormpath.  This allows
Stormpath to interact with the Facebook API on your behalf, which automates all
OAuth flows.

To do this, you need to visit the `Directory dashboard`_ and create a new
directory.  When you click the "Create Directory" button, click the "Facebook"
button, then on the following screen enter your Facebook app information:

- For the "Name" field, you can insert whatever name you want.
- For the "Facebook Client ID" field, insert your Facebook App ID which you got
  in the previous steps.
- For the "Facebook Client Secret" field, insert your Facebook Client Secret
  which you got in the previous steps.

Lastly, be sure to click the "Save" button at the bottom of the page.

Next, you need to hook your new Facebook Directory up to your Stormpath
Application.  To do this, visit the `Application dashboard`_ and select your
Application from the list.

On your Application page, click the "Account Stores" tab, then click the "Add
Account Store" button.  From the drop down list, select your newly created
Facebook Directory, then save your changes.

That's it!


Configure Your Express App
..........................

Now that we've created a new Facebook App and configured our URLs -- we need to
enter our Facebook App secrets into our Express app so that express-stormpath
knows about them.

You can find your Facebook App ID and Secret on your App dashboard page, at the
top of the screen.

In your app's config, you'll want to add the following settings (*don't forget
to substitute in the proper credentials!*)::

    app.use(stormpath.init(app, {
      enableFacebook: true,
      social: {
        facebook: {
          appId: 'xxx',
          appSecret: 'xxx',
        },
      },
    }));

These two settings: ``enableFacebook`` and ``social`` work together to tell
express-stormpath to enable social login support for Facebook, as well as
provide the proper credentials so things work as expected.

.. note::
    We recommend storing your credentials in environment variables.  Please
    don't hard code secret credentials into your source code!


Test it Out
...........

Now that you've plugged your Facebook credentials into express-stormpath, social
login should already be working!

Open your express app in a browser, and try logging in by visiting the login page
(``/login``).  If you're using the default login page included with this
library, you should see the following:

.. image:: /_static/login-page-facebook.png

You now have a fancy new Facebook enabled login button!  Try logging in!  When
you click the new Facebook button you'll be redirected to Facebook, and
prompted to accept the permissions requested:

.. image:: /_static/login-page-facebook-permissions.png

After accepting permissions, you'll be immediately redirected back to your
website at the URL specified by ``redirectUrl`` in your app's config.

Simple, right?!


Use Google Login
----------------

Google Login is incredibly popular -- let's enable it!

In the next few minutes I'll walk you through *everything* you need to know to
support Google login with your app.


Create a Google Project
.......................

The first thing you need to do is log into the `Google Developer Console`_ and
create a new Google Project.

You can do this by visiting the `Developer Console`_ and clicking the "Create
Project" button.  You should see something like the following:

.. image:: /_static/google-new-project.png

Go ahead and pick a "Project Name" (usually the name of your app), and
(*optionally*) a "Project ID".


Enable Google Login
...................

Now that you've got a Google Project -- let's enable Google Login.  The way
Google Projects work is that you have to selectively enable what functionality
each Project needs.

From your `Console Dashboard`_ click on your new Project, then in the side panel
click on the "APIs & auth" menu option.

Now, scroll through the API list until you see "Google+ API", then click the
"OFF" button next to it to enable it.  You should now see the "Google+ API" as
"ON" in your API list:

.. image:: /_static/google-enable-login.png


Create OAuth Credentials
........................

The next thing we need to do is create a new OAuth client ID.  This is what
we'll use to handle user login with Google.

From your `Console Dashboard`_ click the "APIs & auth" menu, then click on the
"Credentials" sub-menu.

You should see a big red button labeled "Create New Client ID" near the top of
the page -- click that.

You'll want to do several things here:

1. Select "Web application" for your "Application Type".
2. Remove everything from the "Authorized Javascript Origins" box.
3. Add the URL of your site (both publicly and locally) into the "Authorized
   Redirect URI" box, with the ``/google`` suffix.  This tells Google where to
   redirect users after they've logged in with Google.

In the end, your settings should look like this:

.. image:: /_static/google-oauth-settings.png

Once you've specified your settings, go ahead and click the "Create Client ID"
button.

Lastly, you'll want to take note of your "Client ID" and "Client Secret"
variables that should now be displayed on-screen.  We'll need these in the next
step.


Create a Google Directory
.........................

Next, we need to input the Google app credentials into Stormpath.  This allows
Stormpath to interact with the Google API on your behalf, which automates all
OAuth flows.

To do this, you need to visit the `Directory dashboard`_ and create a new
directory.  When you click the "Create Directory" button, click the "Google"
button, then on the following screen enter your Google app information:

- For the "Name" field, you can insert whatever name you want.
- For the "Google Client ID" field, insert your Google Client ID which you got
  in the previous steps.
- For the "Google Client Secret" field, insert your Google Client Secret
  which you got in the previous steps.
- For the "Google Authorized Redirect URI" field, insert your Google Redirect
  URL from the previous section. Be sure to *only enter the URI you're currently
  using*.  EG: If you're running your app in development mode, set it to your
  local URL, if you're running your app in production mode, set it to your
  production URL.

Lastly, be sure to click the "Save" button at the bottom of the page.

Next, you need to hook your new Google Directory up to your Stormpath
Application.  To do this, visit the `Application dashboard`_ and select your
Application from the list.

On your Application page, click the "Account Stores" tab, then click the "Add
Account Store" button.  From the drop down list, select your newly created
Google Directory, then save your changes.

That's it!


Configure Your Express App
..........................

Now that we've created a new Google Project and generated OAuth secrets -- we
can now enter these secrets into our Express app so that express-stormpath
knows about them.

In your app's config, you'll want to add the following settings (*don't forget
to substitute in the proper credentials!*)::

    app.use(stormpath.init(app, {
      enableGoogle: true,
      social: {
        google: {
          clientId: 'xxx',
          clientSecret: 'xxx',
        },
      },
    }));

These two settings: ``enableGoogle`` and ``social`` work together to tell
express-stormpath to enable social login support for Google, as well as provide
the proper credentials so things work as expected.

.. note::
    We recommend storing your credentials in environment variables.  Please
    don't hard code secret credentials into your source code!


Test it Out
...........

Now that you've plugged your Google credentials into express-stormpath, social
login should already be working!

Open your Express app in a browser, and try logging in by visiting the login page
(``/login``).  If you're using the default login page included with this
library, you should see the following:

.. image:: /_static/login-page-google.png

You now have a fancy new Google enabled login button!  Try logging in!  When you
click the new Google button you'll be redirected to Google, and prompted to
select your Google account:

.. image:: /_static/login-page-google-account.png

After selecting your account you'll then be prompted to accept any permissions,
then immediately redirected back to your website at the URL specified by
``redirectUrl`` in your app's settings.

Simple, right?!



.. _ID Site dashboard: https://api.stormpath.com/v#!idSite
.. _Application dashboard: https://api.stormpath.com/v#!applications
.. _Directory dashboard: https://api.stormpath.com/v#!directories
.. _createGroup: http://docs.stormpath.com/nodejs/api/application#createGroup
.. _Account: http://docs.stormpath.com/rest/product-guide/#accounts
.. _bootstrap: http://getbootstrap.com/
.. _Jade: http://jade-lang.com/
.. _memcached: http://memcached.org/
.. _redis: http://redis.io/
.. _Directory Dashboard: https://api.stormpath.com/v#!directories
.. _Facebook Developer Site: https://developers.facebook.com/
.. _Google Developer Console: https://console.developers.google.com/project
.. _Developer Console: https://console.developers.google.com/project
.. _Console Dashboard: https://console.developers.google.com/project
.. _curl: http://curl.haxx.se/
.. _client-sessions: https://github.com/mozilla/node-client-sessions
.. _router: http://expressjs.com/api#router
