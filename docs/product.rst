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


Enforce User Authorization
--------------------------

Stormpath supports extremely complex authorization rules.  This section aims to
provide a basic introduction to Express-Stormpath's authorization enforcement
(*this topic is covered in-depth later on*).

The main authorization resource in Stormpath is the ``Group``.  A Stormpath
Group is a named resource (*admins, developers, paid users, free users, etc.*)
which can be assigned to any number of user accounts.

Let's say you're building a site that has three tiers of users: free users, paid
users, and admins.  In this case, you'd want to create three Stormpath Groups:
``free users``, ``paid users``, and ``admins``.

If you visit your Stormpath Directory in the `Directory Dashboard`_, then
click the "Groups" tab, you can create your groups here, as well as assign users
to groups.

.. note::
    If you'd like to learn how to create groups pragmatically, you can look at
    our Node library's `createGroup`_ documentation.

Now that we've created our groups, and also added our user to the "free users"
group -- let's see how we can enforce different types of authorization on
our user using the ``groupsRequired`` middleware::

    var stormpath = require('express-stormpath');


    app.get('/admins', stormpath.groupsRequired(['admins']), function(req, res) {
      res.send('If you can see this page, you must be in the `admins` group!');
    });

If a user tries to visit ``/admins``, they'll get redirected to the login page
and won't be able to access the view.

What if we wanted to build a view only accessible to users who are both free
users and admins?  In this case we could just list both required groups::

    var stormpath = require('express-stormpath');


    app.get('/free_users_and_admins', stormpath.groupsRequired(['free users', 'admins']), function(req, res) {
      res.send('If you can see this page, you must be in the `free users` and `admins` group!');
    });

Now that you've seen how you can require a user to be a member of multiple
groups, let's take a look at how you can enforce selective group membership::

    var stormpath = require('express-stormpath');


    app.get('/any_user', stormpath.groupsRequired(['free users', 'paid users', 'admins'], false), function(req, res) {
      res.send('If you can see this page, you must be in at least one of the specified groups!');
    });

The view above lists three groups, and sets the ``all`` parameter to ``false``
-- signifying that a user must be a member of **at least one** of the listed
groups in order to gain access.


Restrict Session Duration / Expiration
--------------------------------------

Another thing people commonly want to do is restrict how long a user can be
logged in without activity before being forced to log into their account again.

You can easily change the default session / cookie expiration by modifying the
``sessionDuration`` setting::

    var stormpath = require('express-stormpath');


    app.use(stormpath.init(app, {
      sessionDuration: 1000 * 60 * 15, // Make sessions expire after 15 minutes.
    }));

By default, sessions will not expire for one month (*out of convenience*).

.. note::
    The ``sessionDuration`` setting expects an integer, which must be the number
    of **milliseconds** before the session will expire -- if you miscalculate
    this number, your sessions will expire very quickly!


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


Access User Data
----------------

Let's take a quick look at how we can access user data from a custom view.

Let's say we've defined a simple view that should simply display a user's email
address.  We can make use of the magical ``res.locals.user`` context variable to
do this::

    var stormpath = require('express-stormpath');


    app.get('/email', stormpath.loginRequired, function(req, res) {
      res.send('Your email address is:', res.locals.user);
    });

The ``res.locals.user`` context allows you to directly interact with the current
``user`` object.  This means you can perform *any* action on the ``user`` object
directly.

For more information on what you can do with a ``user`` object, please see
the Node library documentation: http://docs.stormpath.com/nodejs/api/account

Let's say you want to change a user's ``givenName`` (*first name*).  You could
easily accomplish this with the following code::

    // assuming we're inside of a request
    res.locals.user.givenName = 'Randall';
    res.locals.user.save(function(err) {
      if (!err) {
        console.log('User change saved successfully.');
      }
    });

As you can see above, you can directly modify ``user`` attributes, then
persist any changes by running ``res.locals.user.save()``.


Working With Custom User Data
-----------------------------

In addition to managing basic user fields, Stomrpath also allows you to store
up to 10MB of JSON information with each user account!

Instead of defining a database table for users, and another database table for
user profile information -- with Stormpath, you don't need either!

Let's take a look at how easy it is to store custom data on a ``user``
model::

    // assuming we're inside of a request
    res.locals.user.customData.somefield = 'somevalue';
    res.locals.user.customData['anotherfield'] = {'json': 'data'};
    res.locals.user.customData['woot'] = 10.202223;
    res.locals.user.save();

    user.customData['woot'];
    // 10.202223

    delete user.customData['woot'];
    user.save(function(err, updatedUser) {
      if (!err) {
        updatedUser.customData.woot;
        // undefined
      }
    });

As you can see above -- storing custom information on a ``user`` account is
extremely simple!


Customize Redirect Logic
------------------------

As you might have already noticed by playing around with the registration and
login pages -- when you first register or log into an account, you'll be
immediately redirected to the URL ``/``.

This is actually a configurable setting -- you can easily modify this default
redirect URL by adding the following config setting::

    app.use(stormpath.init(app, {
      redirectUrl: '/dashboard',
    }));

This allows you to build nicer apps as you can do stuff like redirect newly
registered users to a tutorial, dashboard, or something similar.

.. note::
    If a user visits a page which has restricted access, they'll be redirected
    to the login page.  Once the user logs in, they'll be immediately redirected
    back to whatever page they were initially trying to access (*this behavior
    overrides the ``redirectUrl`` setting*).


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


Customize User Login Fields
---------------------------

If you visit your login page (``/login``), you will see (*by default*), two
input boxes: one for ``email`` and one for ``password``.

While this is fine for most purposes, sometimes you might want to let users log
in with a ``username`` **or** ``email`` (especially if your site collects
``username`` during registration).

Doing this is simple: by enabling the ``enableUsername`` setting you'll not
only make the ``username`` field available on the registration page,
but also on the login page (*so users can log in by entering either their
``username`` or ``email`` and ``password``*).

To enable ``username`` support, just set the following config variable::

    app.use(stormpath.init(app, {
      enableUsername: true,
    }));

You should now see the following on your login page:

.. image:: /_static/login-page.png

.. note::
    In the example above we didn't set the ``requireUsername`` field
    to ``true`` -- if we did, this would ensure that when a new user registers
    for the site, they **must** pick a ``username``.

    The ``requireUsername`` field has no effect on the login page.


Customize User Registration, Login, and Logout Routes
-----------------------------------------------------

By default, Express-Stormpath automatically enables three separate views and
routes:

- ``/register`` - the registration view
- ``/login`` - the login view
- ``/logout`` - the logout view

Customizing the built-in URL routes is quite simple.  There are several config
variables you can change to control these URL mappings.  To change them, just
modify your app's config.

- ``registrationUrl`` -- default: ``/register``
- ``loginUrl`` -- default: ``/login``
- ``logoutUrl`` -- default: ``/logout``

If you were to modify your config such that::

    app.use(stormpath.init(app, {
      registrationUrl: '/welcome',
    }));

Then visit ``/welcome``, you'd see your registration page there, instead!


Customize the Views
-------------------

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
      input(name='_csrf', type='hidden', value=csrfToken)

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

If you'd like to override the default views, you should take a look at the
ones included with Express-Stormpath here:
https://github.com/stormpath/stormpath-express/tree/master/lib/views
and use these as a base for your own views.


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
