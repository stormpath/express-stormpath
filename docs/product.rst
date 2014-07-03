Product Guide
=============

This product guide covers more advanced Express-Stormpath usage.  You can
selectively jump around from topic-to-topic to discover all the neat features
that Express-Stormpath provides!


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
    res.locals.user.givenName = 'Randall'
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


.. _Directory dashboard: https://api.stormpath.com/v#!directories
.. _createGroup: http://docs.stormpath.com/nodejs/api/application#createGroup
.. _Account: http://docs.stormpath.com/rest/product-guide/#accounts
.. _bootstrap: http://getbootstrap.com/
.. _Jade: http://jade-lang.com/
