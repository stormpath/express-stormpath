Product Guide
=============

This product guide covers more advanced Express-Stormpath usage.  You can
selectively jump around from topic-to-topic to discover all the neat features
that Express-Stormpath provides!


Configuration
-------------

There are two ways to configure Express-Stormpath -- you can list all of your
settings manually when initializing the Stormpath middleware, or you can specify
your settings via environment variables.

If you want to specify settings via middleware, you can do so by specifying
their names like so::

    var stormpath = require('express-stormpath');

    app.use(stormpath.init(app, {
      secretKey: 'blah',
      enableHttps: false,
    }));

As an alternative, you could specify these settings via environment variables,
by using the same names, with a twist: each name must be in all caps, start with
'stormpath', and use underscores instead of spaces.

For instance, if I wanted to reproduce the above with environment variables, I
could define the following variables::

    $ export STORMPATH_SECRET_KEY=blah
    $ export STORMPATH_ENABLE_HTTPS=false

.. note::
    If you're on Windows, that will look like::

        set STORMPATH_SECRET_KEY=blah

Then, when defining my middleware, I could simply write::

    var stormpath = require('express-stormpath');

    app.use(stormpath.init(app));


Enforce User Authentication
---------------------------

Now that we've seen how easy it is to register, login, and logout users in your
Express app, let's see how simple it is to restrict views to logged-in users only.

Let's say you have a simple view which should only be accessible to users who
have logged in.  Below is a code sample which shows how easy it is to restrict
access to your view::

    var stormpath = require('express-stormpath');

    app.get('/secret', stormpath.loginRequired, function(req, res) {
      res.send("If you're seeing this page, you must be logged in!");
    });


The ``loginRequired`` middleware makes enforcing user authentication extremely
simple.

If you try to visit the ``/secret`` URL and you're not logged in, you'll be
redirected to: ``/login?next=%2Fsecret``.  If you then enter your credentials
and log in -- you'll be immediately redirected back to the page you were trying
to access: ``/secret``.

As of Express-Stormpath **0.6.0**, there's now another middleware you can use
here: ``stormpath.authenticationRequired``.  It works *exactly* like
``stormpath.loginRequired``, but *also* accepts API authentication.

This is useful if you'd like to build a route which can be accessed both through
the browser using sessions, as well as via a REST API.



Enable Caching
--------------

The best kind of websites are fast websites.  As of version **0.1.5**,
Express-Stormpath includes built-in support for caching.  You can currently use
either:

- A local memory cache (*default*).
- A `memcached`_ cache.
- A `redis`_ cache.

All can be easily configured using configuration variables.

There are several configuration settings you can specify when initializing the
Stormpath middleware:

- ``cache`` - The type of cache to use: ``'memory'``, ``'memcached'``, or
  ``'redis'``).  Defaults to ``'memory'``.  If you want to use local memory as a
  cache, just set memory here and leave all other fields blank!
- ``cacheHost`` - The hostname of the cache (*ex: '127.0.0.1'*).
- ``cachePort`` - The port of the cache (*ex: 11211*).
- ``cacheTTL`` - The amount of time (*in seconds*) to cache resources before
  expiring them.  Defaults to ``300``.
- ``cacheTTI`` - If this amount of time has passed (*in seconds*) since a
  resource was last accessed, it will be expired.  Defaults to ``300``.
- ``cacheOptions`` - An object which holds additional configuration options for
  the cache (*like username, password, etc.*).

Here's an example showing how to enable caching for a memcached server that is
running locally with no username / password::

    var stormpath = require('express-stormpath');

    app.use(stormpath.init(app, {
      cache: 'memcached',
      cacheHost: '127.0.0.1',
      cachePort: 11211,
    }));

Here's an example which shows how to enable caching for a redis server that is
running locally with a required password::

    var stormpath = require('express-stormpath');

    app.use(stormpath.init(app, {
      cache: 'redis',
      cacheHost: '127.0.0.1',
      cachePort: 6379,
      cacheOptions: {
        auth_pass: 'xxx',
      },
    }));


Handling Events
---------------

As of Express-Stormpath **0.2.8**, it is now possible to handle specific events!
This means you can run your own custom code when a specific event happens.

All supported events are listed below.


Post Login
..........

Want to run some custom code after a user logs into your site?  If so, this
is the event you want to handle!

By defining a ``postLoginHandler`` you're able to do stuff like:

- Refresh a user's third-party services.
- Calculate the last login time of a user.
- Prompt a user to complete their profile, or setup billing.
- etc.

To use a ``postLoginHandler``, you need to define your handler function
in the Stormpath middleware setup::

    app.use(stormpath.init(app, {
      postLoginHandler: function(account, req, res, next) {
        console.log('User:', account.email, 'just logged in!');
        next();
      },
    }));

As you can see in the example above, the ``postLoginHandler`` function
takes in four parameters:

- ``account``: The new, successfully logged in, user account.
- ``req``: The Express request object.  This can be used to modify the incoming
  request directly.
- ``res``: The Express response object.  This can be used to modify the HTTP
  response directly.
- ``next``: The callback to call when you're done doing whatever it is you want
  to do.  If you call this, execution will continue on normally.  If you don't
  call this, you're responsible for handling the response.

In the example below, we'll use the ``postLoginHandler`` to redirect the
user to a special page (*instead of the normal login flow*)::

    app.use(stormpath.init(app, {
      postLoginHandler: function(account, req, res, next) {
        res.redirect(302, '/secretpage').end();
      },
    }));



Extra Context For Templates
---------------------------

Your app might need to add custom data like analytics code to the templates. This
data will most likely change depending of the environment you are running on and you
can't hardcode it in the template.

To fix that you can pass extra context to Express-Stormpath like so::

    var stormpath = require('express-stormpath');

    app.use(stormpath.init(app, {
      templateContext: {
        extraData: 'This is extra data.',
        googleAnalyticsID: 'UA-0000000-1',
        mixpanelID: '123456'
      }
    }));

And in each template, you'll have access to ``extraData`` and the other variables
you defined. Keep in mind that thosevalues might override the ones from
Express-Stormpath. If you experience clashes, you might need to check your variable names first.

Customize User Registration Fields
----------------------------------

In many cases you might want to change the fields you collect when a user
registers.  Let's customize the fields we ask for when a user registers!

Every user you register ends up getting stored in Stormpath as an `Account`_
object.  Accounts in Stormpath have several fields you can set:

- username
- email (**required**)
- password (**required**)
- givenName (**required**) also known as "first name"
- middleName
- surname (**required**) also known as "last name"

By default, the built-in registration view that Express-Stormpath ships with gets
you a registration page that looks like this:

.. image:: /_static/registration-page.png

As you can see, it includes the ``givenName``, ``middleName``, ``surname``,
``email``, and ``password`` fields by default.  All of these fields are
required, with the exception of ``middleName``.

What happens if a user enters an invalid value -- or leaves a required field
blank?  They'll see something like this:

.. image:: /_static/registration-page-error.png

But what if you want to force the user to enter a value for middle name?  Doing
so is easy!  Express-Stormpath is **highly customizable**, and allows you to
easily control which fields are accepted, and which fields are required.

To require a user to enter a middle name field, set the following value in your
Express app config::

    app.use(stormpath.init(app, {
      enableMiddleName: true,
      requireMiddleName: true,
    }));

Now go ahead and give it a try -- if you attempt to create a new user and don't
specify a middle name, you'll see an error!

.. note::
    Each Stormpath field allows you to specify two config values:
    ``enableFieldName`` and ``requireFieldName``.  The ``enableXXX`` setting
    controls whether or not the specified field is displayed on the registration
    page -- the ``requireXXX`` field controls whether or not the specified field
    is required by the user to successfully complete the registration process.

Lastly, it's also simple to add in a ``username`` field (*either required or
optional*).  Just like the examples above, you can use the ``enable`` and
``require`` settings to control the registration behavior::

    app.use(stormpath.init(app, {
      enableUsername: true,
      requireUsername: true,
    }));

And that's it!

Custom Views & Routes
---------------------

Now that your website is fully functioning with login and registration,
you'll want to add your own pages to the site!  In Express these are
referred to as views that are served by routes.

You  need to tell Express which templating engine you'd like to use.
While we use Jade for the built-in views you are free to use your engine
of choice when creating your own pages.

Using Jade
..........

If you wish to use Jade, you'll need to add the Jade package to your project::

    npm install --save jade

Then declare this in your configuration::

    app.set('views', './views');
    app.set('view engine', 'jade');

With that you're good to go!  Going back to our previous example, let's say
we had a page that we wanted to serve at ``/secret``.  We'll create a file
``views/secret.jade`` and put this template in it::

    html
      head
        title=title
      body
        p Hello, #{user.username}
        p You are permitted to see the secrets

Then create a route handler for this page::

    app.get('/secret', stormpath.loginRequired, function(req, res) {
      res.render('secret', {
        title: 'Top Secret HQ'
      });
    });


Using EJS
.........

Jade not your thing?  No problem!  EJS is just as easy to configure.

Just install the package::

    npm install --save ejs

Then configure your app like this::

    app.set('views', './views');
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');

EJS uses HTML, so your file will now be named ``views/secret.html`` and will
look like this::

    <html>
      <head>
        <title><%= title %></title>
      </head>
      <body>
        <p>Hello, <%= user.username %></p>
        <p>You are permitted to see the secrets</p>
      </body>
    </html>

The route handler will look exactly the same as the Jade example above.  That
is the beauty of the templating layer in Express!


Customize the Built-in Views
----------------------------

Although I personally find our registration and login pages to be incredibly
good looking -- I realize that you might not share my same design passion!

Express-Stormpath was built with customizability in mind, and makes it very easy
to build your own custom registration and login views.

Let's start by looking at the built-in views:
https://github.com/stormpath/stormpath-express/tree/master/lib/views

Here's a quick rundown of what each template is for:

- ``base.jade`` is the base template that the registration and login templates
  extend.  It provides a basic `bootstrap`_ based layout, with a couple of
  blocks for customizing the child templates.
- ``login.jade`` is the login page.  It has some logic to flash error messages
  to the user if something fails, and also dynamically determines which input
  boxes to display based on the app's settings.
- ``register.jade`` is the registration page.  It has some logic to flash error
  messages to the user if something fails, and also dynamically determines
  which input boxes to display based on the app's settings.

If you're comfortable with `Jade`_, you can copy these templates to your
project directly, and customize them yourself.  If you're not already a super
Express guru, continue reading!


The Most Basic View
...................

Let's say you want to build your own, fully customized registration and login
views -- no problem!

The first thing you need to do is create two views in the ``views``
directory of your project.

First, copy the following code into ``views/register.jade``::

    // Display an error if there is any.
    if error
      p #{error}

    form(method='post')
      // This block of code renders the desired input boxes for registering users.
      if app.get('stormpathEnableUsername')
        input(placeholder='Username', name='username', required=app.get('stormpathRequireUsername') ? true : false, type='text')

      if app.get('stormpathEnableGivenName')
        input(placeholder='First Name', name='givenName', required=app.get('stormpathRequireGivenName') ? true : false, type='text')

      if app.get('stormpathEnableMiddleName')
        input(placeholder='Middle Name', name='middleName', required=app.get('stormpathRequireMiddleName') ? true : false, type='text')

      if app.get('stormpathEnableSurname')
        input(placeholder='Last Name', name='surname', required=app.get('stormpathRequireSurname') ? true : false, type='text')

      input(placeholder='Email', name='email', required='true', type='text')
      input(placeholder='Password', name='password', required='true', type='password')

      button(type='submit') Create Account

The simple template you see above is the most basic possible registration page.
It renders all of the appropriate input forms, based on your settings.

Next, copy the following code into ``views/login.jade``::

    // Display an error if there is any.
    if error
      p #{error}

    form(method='post')
      input(name='_csrf', type='hidden', value=csrfToken)

      if app.get('stormpathEnableUsername')
        input(placeholder='Username or Email', required=true, name='login', type='text')
      else
        input(placeholder='Email', required=true, name='login', type='text')

      input(placeholder='Password', required=true, type='password', name='password')
      button(type='submit') Log In

This is the most basic login template possible.


Update Template Paths
.....................

Now that you've got the simplest possible templates ready to go, let's activate
them!  In your app's config, you'll need to specify the path to your new
templates like so::

    app.use(stormpath.init(app, {
      registrationView: __dirname + '/views/register.jade',
      loginView: __dirname + '/views/login.jade',
    }));

That will tell Express-Stormpath to render the templates you created above instead
of the built-in ones!

Now, if you open your browser and checkout ``/register`` and ``/login``, you
should see something like the following:

.. image:: /_static/registration-page-basic.png

.. image:: /_static/login-page-basic.png

**BAM!**  That wasn't so bad, was it?  You now have your own customized
registration and login templates -- all you need to do now is design them the
way you want!


Disable the Built-in Views
--------------------------

If for some reason you want to write your own registration, login, and logout
views (*not recommended*), you can easily disable all of the automatic
functionality described above by modifying your app config and adding the
following::

    app.use(stormpath.init(app, {
      enableRegistration: false,
      enableLogin: false,
      enableLogout: false,
    }));


Passing Extra Variables to the Built-in Templates
-------------------------------------------------

If you've started to customize the base Stormpath templates that render the
registration and login pages (*as well as many others*), you might have been
wondering how you can pass extra information into each template -- stuff like
your Google Analytics tracking code, social sharing stuff, etc.

As of Express-Stormpath **0.4.9**, you're now able to define a JSON object that
will be automatically available to all of the Stormpath templates!

The way this works is simple.

Firstly, you can you specify your template variables during the middleware
initialization process or via an environment variable::

    app.use(stormpath.init(app, {
      templateContext: {
        googleAnalyticsCode: 'UA-XXX-XX',
        intercomId: 'xxx',
      },
    }));

Or, if you prefer environment variables::

    $ export STORMPATH_TEMPLATE_CONTEXT='{"googleAnalyticsCode": "UA-XXX-XX", "intercomId": "xxx"}'

Now that you've defined your variables, you can use them freely inside of your
customized Stormpath templates!  For example, if you wanted to customize the
built-in ``registration.jade`` template, you could create a new Jade file that
looks like this::

    html
      body
        script(type="text/javascript").
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

          ga('create', '#{googleAnalyticsCode}', 'auto');
          ga('send', 'pageview');

See how the template above now has the Google Analytics Tracking code embedded
in it?  This is working because the ``#{googleAnalyticsCode}`` variable is being
made available to your templates automatically.

Lastly, in order to activate your new template, you need to activate it::

    app.use(stormpath.init(app, {
      registrationView: __dirname + '/views/register.jade',
    }))

Once you've done that, you'll be good to go!


Use Account Verification
------------------------

As of Express-Stormpath **0.1.8**, it is now possible to easily enable an
"Account Verification Workflow", which makes newly registered users click a link
in in their email inbox before completing user the user registration process.

If you'd like to ensure your users are registering with legitimate email
addresses, this feature makes the process as painless as possible =)


Configure the Workflow
......................

The first thing you need to do to enable "Account Verification" functionality
in your Express app is visit the `Directory Dashboard`_ and select your default
user directory.

Next, you should see several options in a tab.  You will want to click the
"Workflows" button.  Once you've landed on this page, you'll then want to click
the "show" link to the right of the "Account Registration and Verification"
header.  This section allows you to configure your "Account Verification"
settings.

On this page, the only thing you **need** to change is the "Account Verification
Base URL" setting at the top.  You need to set this to be:
``https://mysite.com/verified``, substituting in your own website address.

For instance, if your site lives at ``https://www.mysite.com``, you'll want to
set "Account Verification Base URL" to ``https://www.mysite.com/verified``.

This URL determines where a user will be redirected after clicking the
verification link in the email we send them.  If you're testing things out
locally, you can also set this to a local URL (eg:
``http://localhost:3000/verified``).

After setting "Account Verification Base URL", you can also adjust any of the
other settings below -- you can customize the email templates that are used to
email the user, and a variety of other options.

When you're finished customizing the "Account Verification Workflow", be sure
to hit the "Update" button at the bottom of the page.


Enable Account Verification in Your App
.......................................

Now that you've configured the "Account Verification" settings on Stormpath's
side, you need to configure your Express application to enable account
verification.

You can do this easily by modifying your application config like so::

    app.use(stormpath.init(app, {
      enableAccountVerification: true,
    }));

And...  That's all you have to do!


Test it Out
...........

Now that you've fully enabled account verification functionality in your app,
open up the registration page in your Express app and check it out!  After
creating a new user account, you'll be greeted by a message informing you that
before you can continue you need to click the verification link in your inbox.
This page looks like this:

.. image:: /_static/verification.png

Then, depending on your "Account Verification Workflow" configuration, the user
will see an email that looks like the following:

.. image:: /_static/verification-email.png

When a user clicks the link in their email, they'll reach a success page that
looks like this:

.. image:: /_static/verification-complete.png

And lastly, once a user clicks the verification link, they'll be automatically
logged into their account, then redirected to the main page of your site
(whatever URL is set as ``redirectUrl`` in your configuration).  They'll also
be shown this page for a few seconds to let them know the change was successful.

Not bad, right?


Customization
.............

Much like all other Express-Stormpath features, the account verification feature is
completely customizable.

You can easily change the account verification templates by modifying the following
configuration variables, respectively:

- ``stormpathAccountVerificationEmailSentView`` - The view which is shown after
  a new user creates an account.
- ``stormpathAccountVerificationCompleteView`` - The view which is shown after
  a user clicks the verification link in their email.

If you'd like to override the default views, you should take a look at the
ones included with Express-Stormpath here:
https://github.com/stormpath/stormpath-express/tree/master/lib/views
and use these as a base for your own views.


Use Password Reset
------------------

As of Express-Stormpath **0.1.6**, it is now possible to easily enable a "Password
Reset Workflow", which allows your users to reset their passwords automatically.

We highly encourage you to use this feature, as it provides a simple and secure
way to allow your users to reset their passwords without hassle.


Configure the Workflow
......................

The first thing you need to do to enable "Password Reset" functionality in your
Express app is visit the `Directory Dashboard`_ and select your default user
directory.

Next, you should see several options in a tab.  You will want to click the
"Workflows" button.  Once you've landed on this page, you'll then want to click
the "show" link to the right of the "Password Reset" header.  This section
allows you to configure your "Password Reset" settings.

On this page, the only thing you **need** to change is the "Base URL" setting at
the top.  You need to set this to be: ``https://mysite.com/forgot/change``,
substituting in your own website address.

For instance, if your site lives at ``https://www.mysite.com``, you'll want to
set "Base URL" to ``https://www.mysite.com/forgot/change``.

This URL determines where a user will be redirected after attempting to reset
their password on your website.  If you're testing things out locally, you can
also set this to a local URL (eg: ``http://localhost:3000/forgot/change``).

After setting "Base URL", you can also adjust any of the other settings below --
you can customize the email templates that are used to email the user, and a
variety of other options.

When you're finished customizing the "Password Reset Workflow", be sure to hit
the "Update" button at the bottom of the page.


Enable Password Reset in Your App
.................................

Now that you've configured the "Password Reset" settings on Stormpath's side,
you need to configure your Express application to enable password reset.

You can do this easily by modifying your application config like so::

    app.use(stormpath.init(app, {
      enableForgotPassword: true,
    }));

And...  That's all you have to do!


Test it Out
...........

Now that you've fully enabled password reset functionality in your app, open up
the login page in your Express app and check it out!  You should see a "Forgot
Password?" link below the login form which looks like this:

.. image:: /_static/forgot.png

If you click the "Forgot Password?" link, you'll be brought to a password reset
page that looks like this:

.. image:: /_static/forgot-init.png

After filling in their email address, a user will see the following page:

.. image:: /_static/forgot-email-sent.png

Then, depending on your "Password Reset Workflow" configuration, the user will
see an email that looks like the following:

.. image:: /_static/forgot-email.png

When a user clicks the link in their email, they'll reach a password change page
that looks like this:

.. image:: /_static/forgot-change.png

And lastly, once a user changes their password successfully, they'll be
automatically logged into their account, then redirected to the main page of
your site (whatever URL is set as ``redirectUrl`` in your configuration).
They'll also be shown this page for a few seconds to let them know the change
was successful:

.. image:: /_static/forgot-complete.png

Not bad, right?


Customization
.............

Much like all other Express-Stormpath features, the password reset feature is
completely customizable.

You can easily change the password reset templates by modifying the following
configuration variables, respectively:

- ``forgotPasswordView`` - The view which is shown when a user clicks the
  "Forgot Password?" link on the login page.
- ``forgotPasswordEmailSentView`` - The view which is shown after a user
  has successfully requested a password reset.
- ``forgotPasswordChangeView`` - The view which is shown to a user after
  they've clicked the link in their email.  This view allows the user to
  change their password.
- ``forgotPasswordCompleteView`` - The view which is shown after the user has
  successfully reset their account password.
- ``enableForgotPasswordChangeAutoLogin`` - This setting determines whether or
  not you want a user who has just changed their password to be automatically
  logged into their account or not.  The default behavior is to log the user out
  and force them to re-authenticate manually.

If you'd like to override the default views, you should take a look at the
ones included with Express-Stormpath here:
https://github.com/stormpath/stormpath-express/tree/master/lib/views
and use these as a base for your own views.


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


Use Hosted Login
----------------

If you'd like to use Stormpath's new hosted login functionality (*known as ID
Site*), you can now do so using Express-Stormpath 0.2.2+!

Stormpath's ID Site functionality works as so:

- If a user wants to register for your web site, they'll be redirected to your
  ID site URL (*hosted by Stormpath*).  This can be something like:
  https://login.mysite.com

- Stormpath will then display a login / registration / forgot password page
  automatically, depending on what the user wants to do, allowing the user to
  register **without touching your Express application!**  These pages can be
  completely customized however you like, of course.

- Once Stormpath has registered or logged the user in, they'll be redirected
  back to a route on your Express app (*which defaults to /redirect*).  This
  route will then verify that the user was successfully logged in, and create a
  user session.

- Lastly, the user will be redirected back to whatever page on your site is
  configured as the ``redirectUrl`` (*this defaults to /*).

For more information on ID Site, please read the official documentation:
http://docs.stormpath.com/guides/using-id-site/


Enable ID Site
..............

The first step in getting hosted login working is enabling the ID Site
functionality on Stormpath.

To do this, you'll want to first visit your `ID Site dashboard`_.  This page is
where you can configure your hosted login functionality.

.. note::
    These instructions will only cover using the built-in hosted login site --
    if you'd like to customize your ID Site URL or theme, that will be covered
    later.

In the box labeled "Authorized Redirect URIs", enter your redirect URL -- this
should be set to something like: ``https://www.mysite.com/redirect``.  If you're
testing locally, you might want to set this to:
``http://localhost:3000/redirect``.

If you'd like to support *both* production and local environments, you can add
multiple URLs (*just click the "Add another" button and enter as many URLs as
you'd like*).

Lastly, make sure to click the "Update" button at the bottom of the page to save
your changes.

In the end, it should look something like this:

.. image:: /_static/id-site-settings.png


Configure Your Express App
..........................

Now that we've configured Stormpath properly, let's configure our Express app!

In your app's config, you'll want to add the following settings::

    app.use(stormpath.init(app, {
      enableIdSite: true,
    }));

This setting tells Express-Stormpath to use the hosted login functionality
instead of the built-in local authentication functionality.


Test it Out
...........

Now that you've configured hosted login, let's give it a test.

If you start your Express server, then visit either the login or registration
page (*/login or /registration, respectively*), you should be redirected to your
hosted login site on Stormpath, where you can either create or log into your
account.

Once you've logged in, you'll be redirected back to your application in a logged
in state!

Here's a screenshot of the login page to show you what the hosted login site
currently looks like:

.. image:: /_static/id-site-login.png


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
