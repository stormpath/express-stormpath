Social Login
============

Do you want users to authenticate with a social provider, such as Facebook?
Stormpath provides integration with the following services:

* Facebook
* Github
* Google
* Linkedin

In this guide we will cover Facebook, Google, and LinkedIn. GitHub has a very
similar flow, and this guide will show you by example.


Facebook Login
--------------

To use Facebook Login you must create a Facebook Application, this is done
through their Developer site.  In the next few minutes I'll walk you through
*everything* you need to know to support Facebook login with your app.


Create a Facebook App
.....................

The first thing you need to do is log into the `Facebook Developer Site`_ and
create a new Facebook App.

You can do this by visiting the `Facebook Developer Site`_ and clicking the "Apps"
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

Next, we need to input the Facebook app credentials into Stormpath Directory.
This allows Stormpath to interact with the Facebook API on your behalf, which
automates all OAuth flows.

To do this, you need to visit the `Stormpath Admin Console`_ and create a new
directory.  When you click the "Create Directory" button you will choose
"Facebook" as the provider, and enter the following information about your
Facebook application:

- For the "Name" field, you can insert whatever name you want.
- For the "Facebook Client ID" field, insert your Facebook App ID which you got
  in the previous steps.
- For the "Facebook Client Secret" field, insert your Facebook Client Secret
  which you got in the previous steps.

Make sure to click "Create" to finish creating your directory.

Next, you need to hook your new Facebook Directory up to your Stormpath
Application.  To do this, visit the `Stormpath Admin Console`_, navigate to
Applications, and select your application from the list.

On your application page, click the "Account Stores" tab, then click the "Add
Account Store" button.  From the drop down list, select your newly created
Facebook Directory, then save your changes.

That's it!


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

.. note::

  By default the configuration ``web.social.facebook.scope`` is set to ``email``. Change
  this configuration value to request additional scopes.

Simple, right?!

Logging in using an Access Token
................................

If you want to use a Facebook SDK to login a user you can easily do so by grabbing the
Access Token from the SDK login response and then POST it to the ``/login`` endpoint.

To show you exactly what that means, let's say that you're using the JavaScript SDK and
calling ``FB.login(...)``:

.. code-block:: javascript

  FB.login(function (response) {
    if (!response.authResponse) {
      return console.error('User cancelled login or did not fully authorize.');
    }

    // Login by making POST request to /login with the value from:
    // response.authResponse.accessToken
  });

Now, using the Access Token received in the callback response (``response.authResponse.accessToken``) you can create a new ``POST`` request to the
``/login`` endpoint with a JSON body as shown below:

.. code-block:: javascript

  {
    providerData: {
      providerId: 'facebook',
      accessToken: '**your access token value**'
    }
  }

When successful you'll receive a ``200 OK`` response. If the login fails a ``401 Unauthorized`` response will be returned.


Google Login
------------

Integrating Google Login is very similar to Facebook.  You must create an application
in the Google Developer Console, then create a Directory in Stormpath which holds
settings for the Google application that you created.


Create a Google Project
.......................

The first thing you need to do is log into the `Google Developer Console`_ and
create a new Google Project.

You can do this by visiting the `Google Developer Console`_ and clicking the "Create
Project" button.  You should see something like the following:

.. image:: /_static/google-new-project.png

Go ahead and pick a "Project Name" (usually the name of your app), and
(*optionally*) a "Project ID".

Create OAuth Credentials
........................

The next thing we need to do is create a new OAuth client ID.  This is what
we'll use to handle user login with Google.

From your project, click the "APIs & auth" menu, then click on the "Credentials"
sub-menu.

You should see a big red button labeled "Create New Client ID" near the top of
the page -- click that.

You'll want to do several things here:

1. Select "Web application" for your "Application Type".
2. Remove everything from the "Authorized Javascript Origins" box.
3. Add the callback URI of your site (both publicly and locally) into the
   "Authorized Redirect URI" box.  This tells Google where to
   redirect users after they've logged in with Google.  The default callback
   URI for this library is ``/callbacks/google``.

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

To do this, you need to visit the `Stormpath Admin Console`_ and create a new
directory from the Directories section.  When you click "Create Directory",
choose "Google" as the provider, and enter the following information about your
Google application:

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
Application.  To do this, visit the Applications section and select your
application from the list.

On your application page, click the "Account Stores" tab, then click the "Add
Account Store" button.  From the drop down list, select your newly created
Google Directory, then save your changes.

That's it!


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

.. note::

  By default the configuration ``web.social.google.scope`` is set to ``email profile``. Change
  this configuration value to request additional scopes.

Simple, right?!


Logging in using an Access Token
................................

Using the Access Token (implicit) workflow is preferable when you're logging in from a place where
the storage can be trusted. E.g. from your back-end where only you have access to the Access Token.

Now, in order to exchange your Access Token for a Stormpath session, make a ``POST`` request to the
Stormpath ``/login`` endpoint using the Access Token as shown below:

.. code-block:: javascript

  {
    providerData: {
      providerId: 'google',
      accessToken: '**your access token value**'
    }
  }

When successful the request will return a ``200 OK`` HTTP response and a secure cookie session
containing your Stormpath Access Token will be set. If the login fails a ``401 Unauthorized``
response will be returned.


Logging in using an Authorization Code
......................................

Using the Authorization Code workflow is preferable when logging in using a device from which the
storage cannot be trusted. E.g. a browser where malicious JavaScript might try and steal the data
stored.

To illustrate how to login with an Authorization Code we'll use Google's JavaScript SDK to initiate
a login request. Then once the login has been approved and we're redirected with an Authentication Code
we'll take that code from the login response and send that to the Stormpath ``/login`` endpoint so that
the Authorization Code can be exchanged for a new Stormpath session.

To show you exactly what that means. When using Google's JavaScript SDK and calling ``auth2.grantOfflineAccess(...)``:

.. code-block:: javascript

  gapi.load('auth2', function() {
    var auth2 = gapi.auth2.init({
      client_id: 'YOUR CLIENT ID',
      cookiepolicy: 'single_host_origin'
    });

    auth2.grantOfflineAccess({
      redirect_uri: 'postmessage'
    }).then(function (response) {
      // Login by making a POST request to /login with the authorization code:
      // response.code
    }, function (err) {
      console.error('User cancelled login or did not fully authorize.');
    });
  });

Now, using the Authorization Code received in the callback response (``response.code``) you can create a new ``POST`` request to the
``/login`` endpoint with a JSON body as shown below:

.. code-block:: javascript

  {
    providerData: {
      providerId: 'google',
      code: '**your authorization code value**'
    }
  }

When successful the request will return a ``200 OK`` HTTP response and a secure cookie session
containing your Stormpath Access Token will be set. If the login fails a ``401 Unauthorized``
response will be returned.


LinkedIn Login
--------------

Integrating LinkedIn Login is very similar to Google. You must create an application
in the LinkedIn Console, then create a Directory in Stormpath which holds
settings for the LinkedIn application that you created.


Create a LinkedIn Application
.............................

The first thing you need to do is log into the `LinkedIn Developer Console`_ and
create a new LinkedIn Application.

You can do this by visiting the `LinkedIn Developer Console`_ and clicking the "Create
Application" button.  You should see something like the following:

.. image:: /_static/linkedin-new-application.gif

Continue by filling out all the required fields.


Enable LinkedIn Permissions
...........................

Now that you've got a LinkedIn Application -- let's enable LinkedIn permissions.  The way
LinkedIn Applications work is that you have to selectively enable what permissions
each Application requires.

Under the "Default Application Permissions" section, be sure to enable the "r_basicprofile"
and the "r_emailaddress" permissions. These permissions allow Stormpath to access the basic
profile properties (first, middle, and last name) and email (*these permissions are required*).

.. image:: /_static/linkedin-add-permissions.gif

The next thing we need to do is add in all of the allowed Redirect URLs for our application.  Well do this by
entering all of our absolute redirect URLs under the "OAuth 2.0" section.  For instance, if I was running
my site locally on port 3000, as well as under the "www.example.com" domain, I'd add two redirect URIs:

- http://localhost:3000/callbacks/linkedin
- https://www.example.com/callbacks/linkedin

.. image:: /_static/linkedin-add-authorized-urls.gif

Create a LinkedIn Directory
...........................

Next, we need to input the LinkedIn Application credentials into Stormpath.  This allows
Stormpath to interact with the LinkedIn API on your behalf, which automates all
OAuth flows.

To do this, you need to visit the `Stormpath Admin Console`_ and create a new
directory from the Directories section.  When you click "Create Directory",
choose "LinkedIn" as the provider, and enter the following information about your
LinkedIn Application:

- For the "Name" field, you can insert whatever name you want.
- For the "LinkedIn Client ID" field, insert your LinkedIn Client ID which you got
  in the previous steps.
- For the "LinkedIn Client Secret" field, insert your LinkedIn Client Secret
  which you got in the previous steps.

Lastly, be sure to click the "Save" button at the bottom of the page.

Next, you need to hook your new LinkedIn Directory up to your Stormpath
Application.  To do this, visit the Applications section and select your
application from the list.

On your application page, click the "Account Stores" tab, then click the "Add
Account Store" button.  From the drop down list, select your newly created
LinkedIn Directory, then save your changes.

That's it!


Test it Out
...........

Now that you've plugged your LinkedIn credentials into express-stormpath, social
login should already be working!

Open your Express app in a browser, and try logging in by visiting the login page
(``/login``).  If you're using the default login page included with this
library, you should see the following:

.. image:: /_static/login-page-linkedin.png

You now have a fancy new LinkedIn enabled login button!  Try logging in!  When you
click the new LinkedIn button you'll be redirected to LinkedIn, and prompted to
select your LinkedIn account:

.. image:: /_static/linkedin-permissions-page.png

After selecting your account you'll then be prompted to accept any permissions,
then immediately redirected back to your website at the URL specified by
``redirectUrl`` in your app's settings.

.. note::

  By default the configuration ``web.social.linkedin.scope`` is set to ``r_basicprofile r_emailaddress``. Change
  this configuration value to request additional scopes.

Simple, right?!


Logging in using an Access Token
................................

Using the Access Token (implicit) workflow is prefered when you're logging in from a place where
the storage can be trusted. E.g. from your back-end where only you have access to the Access Token.

But in this case, to illustrate how to login with an Access Token we'll use LinkedIn's JavaScript SDK to
initiate a login request. Then once the login has been approved and our callback is called with an Access Token
we'll take that token and send it to the Stormpath ``/login`` endpoint so that the Access Token can be
exchanged for a new Stormpath session.

To show you exactly what that means. When using LinkedIn's JavaScript SDK and calling ``IN.User.authorize(...)``:

.. code-block:: javascript

  IN.User.authorize(function () {
    // Login by making a POST request to /login with the access token:
    // IN.ENV.auth.oauth_token
  });

Now, in order to exchange your Access Token for a Stormpath session, make a ``POST`` request to the
Stormpath ``/login`` endpoint using the Access Token as shown below:

.. code-block:: javascript

  {
    providerData: {
      providerId: 'linkedin',
      accessToken: '**your access token value**'
    }
  }

When successful the request will return a ``200 OK`` HTTP response and a secure cookie session
containing your Stormpath Access Token will be set. If the login fails a ``401 Unauthorized``
response will be returned.


Logging in using an Authorization Code
......................................

Using the Authorization Code workflow is preferable when logging in using a device from which the
storage cannot be trusted. E.g. a browser where malicious JavaScript might try and steal the data
stored.

To illustrate how to login with an Authorization Code we'll redirect to LinkedIn's OAuth
Authorization endpoint:

.. code-block:: javascript

  https://www.linkedin.com/oauth/v2/authorization?
    response_type=code&
    client_id=YOUR_LINKEDIN_CLIENT_ID&
    redirect_uri=URI_TO_RECEIVE_AUTHORIZATION_CODE_ON&
    scope=r_basicprofile%20r_emailaddress&
    state=987654321

Now, using the Authorization Code received on the redirect URI we'll create a new ``POST`` request to the
``/login`` endpoint with a JSON body as shown below:

.. code-block:: javascript

  {
    providerData: {
      providerId: 'linkedin',
      code: '**authorization code recieved on callback URI**'
    }
  }

When successful the request will return a ``200 OK`` HTTP response and a secure cookie session
containing your Stormpath Access Token will be set. If the login fails a ``401 Unauthorized``
response will be returned.


JSON API
--------

If you have a front-end client that is using the pop-up flow for social login,
you will need to use the JSON API on our Login endpoint.  Once you have
collected the access token or code from the user, you can make this POST request
to ``/login``:

.. code-block:: javascript

  {
    providerData: {
      providerId: 'google', // or 'facebook'
      accessToken: 'xxx', // obtained from the provider
      code: 'xxx' // obtained from the provider
    }
  }

.. note::

  How you authenticate the user with the pop-up flow will determine if you get
  an access token or code in response.  You should only use the code or access
  token when making the POST request to our login endpoint.  Do not use both.


.. _Stormpath Admin Console: https://api.stormpath.com
.. _Facebook Developer Site: https://developers.facebook.com/
.. _Google Developer Console: https://console.developers.google.com/project
.. _LinkedIn Developer Console: https://www.linkedin.com/developer/apps
