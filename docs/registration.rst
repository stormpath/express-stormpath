.. _registration:

Registration
=========================

The registration feature of this library allows you to use Stormpath to create
new accounts in a Stormpath directory.  You can create traditional password-
based accounts, or gather account data from other providers such as Facebook and
Google.

If you've opted into the ``{ web: true }`` option in your configuration, you
will have registration enabled by default.  The registration page will then be
available at this URL:

http://localhost:3000/register


Default Fields
--------------------------

The registration form will render these fields by default, and the will be
required by the user:

* giveName
* lastName
* email
* password

While email and password will always be required (you'll get an API error if
you omit them), you may not need to require first and last name.  These
can be configured, and we'll cover that in the next section

Customizing The Fields
--------------------------

You can modify the fields that we render by default.  For example, if you want
to provide the last name field but not make it required, change the required
property in your configuration::

    "register": {
      "fields": {
        "surname": {
          "required": false
        }
      }
    }

If you want to remove all the extra fields, and only render the email and password
fields, you can do so by modifying the field order array::

    "register": {
      "fieldOrder": [ "email", "password", "passwordConfirm" ],
    }

Password Strength Rules
--------------------------

Stormpath supports complex password strength rules, such as number of letters
or special characters required.  These settings are controlled on a directory
basis.  If you want to modify the password strength rules for your application
you should use the `Stormpath Admin Console`_ to find the directory that is mapped
to your application, and modify it's password policy.

For more information see `Account Password Strength Policy`_.

Email Verification
--------------------------

We **highly** recommend that you use email verification, as it adds a layer
of security to your site (it makes it harder for bots to create spam accounts).

One of our favorite Stormpath features is email verification.  When this workflow
is enabled on the directory, we will send the new account an email with a link
that they must click on in order to verify their account.  When they click on
that link they will need to be directed to this URL:

http://localhost:3000/verify?sptoken=TOKEN

We have to configure our directory in order for this to happen. Use the
`Stormpath Admin Console`_ to find the directory of your application, then
go into the Workflows section.  In there you will find the email verification
workflow, which should be enabled by default (enable it if not).  Then modify
the template of the email to use this value for the `Link Base URL`:

.. code-block:: sh

    http://localhost:3000/verify

When the user arrives on the verification URL, we will verify that their email
link is valid and hasn't already been used.  If the link is valid we will redirect
them to the login page.  If there is a problem with the link we provide a form
that allows them to ask for a new link.

Auto Login
------------

If you are *not* using email verificaion (not recommended) you may log users in
automatically when they register.  This can be achieved with this config::

    {
      register: {
        autoLogin: true,
        nextUri: '/'
      }
    }

By default the nextUri is to the `/` page, but you can modify this.

Post Registration Handler
--------------------------

Want to run some custom code after a user registers for your site?  If so, this
is the event you want to handle!

By defining a ``postRegistrationHandler`` you're able to do stuff like:

- Send a new user a welcome email.
- Generate API keys for all new users.
- Setup Stripe billing.
- etc.

To use a ``postRegistrationHandler``, you need to define your handler function
in the Stormpath middleware setup::

    app.use(stormpath.init(app, {
      postRegistrationHandler: function(account, req, res, next) {
        console.log('User:', account.email, 'just registered!');
        next();
      },
    }));

As you can see in the example above, the ``postRegistrationHandler`` function
takes in four parameters:

- ``account``: The new, successfully created, user account.
- ``req``: The Express request object.  This can be used to modify the incoming
  request directly.
- ``res``: The Express response object.  This can be used to modify the HTTP
  response directly.
- ``next``: The callback to call when you're done doing whatever it is you want
  to do.  If you call this, execution will continue on normally.  If you don't
  call this, you're responsible for handling the response.

In the example below, we'll use the ``postRegistrationHandler`` to redirect the
user to a special page (*instead of the normal registration flow*)::

    app.use(stormpath.init(app, {
      postRegistrationHandler: function(account, req, res, next) {
        res.redirect(302, '/secretpage').end();
      },
    }));


JSON API
--------

If you are using this library from a SPA framework like Angular or React, you
will want to make a JSON post to register users.  Simply post an object to
``/register`` that looks like this, and supply the fields that you wish to
populate on the user::

    {
        "email": "foo@bar.com",
        "password": "mySuper3ecretPAssw0rd",
        "surname": "optional"
    }

If the user is created successfully you will get a 200 response and the body
will the the account object that was created.  If there was an error you
will get an object that looks like ``{ error: 'error message here'}``

.. _Stormpath Admin Console: https://api.stormpath.com
.. _Account Password Strength Policy: https://docs.stormpath.com/rest/product-guide/#account-password-strength-policy