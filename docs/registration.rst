.. _registration:


Registration
============

The registration feature of this library allows you to use Stormpath to create
new accounts in a Stormpath directory.  You can create traditional password-
based accounts, or gather account data from other providers such as Facebook and
Google.

By default this library will serve an HTML registration page at ``/register``.
You can change this URI with the ``web.register.uri`` option.  You can disable
this feature entirely by setting ``web.register.enabled`` to ``false``.

http://localhost:3000/register


Configuration Options
---------------------

This feature supports several options.  This example shows what is possible,
we will cover them in detail below:

.. code-block:: javascript

    {
      web: {
        register: {
          enabled: true,
          uri: '/signup',  // Use a different URL
          nextUri: '/',    // Where to send the user to, if auto login is enabled
          form: {
            fields: {
              /* see next section for documentation */
            },
            fieldOrder: [ /* see next section */ ]
          }
        }
      }
    }


Modifying Default Fields
------------------------

The registration form will render these fields by default, and they will be
required by the user:

* givenName
* surname
* email
* password

While email and password will always be required, you do not need to require
first and last name.  These can be configured as optional fields, or omitted
entirely.  You can also specify your own custom fields.  We'll cover each use
case in detail.

Configure First Name and Last Name as Optional
..............................................

If you would like to show the fields for first name and last name, but not
require them, you can set required to false::

    web: {
      register: {
        form: {
          fields: {
            givenName: {
              required: false
            },
            surname: {
              required: false
            }
          }
        }
      }
    }

Because the Stormpath API requires a first name and last name, we will auto-fill
these fields with `UNKNOWN` if the user does not provide them.


Disabling First Name and Last Name
..................................

If you want to remove these fields entirely, you can set enabled to false::

    web: {
      register: {
        form: {
          fields: {
            givenName: {
              enabled: false
            },
            surname: {
              enabled: false
            }
          }
        }
      }
    }

Because the Stormpath API requires a first name and last name, we will auto-fill
these fields with `UNKNOWN` when a user registers.

.. _custom_form_fields:

Creating Custom Fields
----------------------

You can add your own custom fields to the form.  The values will be
automatically added to the user's custom data object when they register
successfully.  You can define a custom field by defining a new field object,
like this::

    web: {
      register: {
        form: {
          fields: {
            favoriteColor: {
              enabled: true,
              label: 'Favorite Color',
              name: 'favoriteColor',
              placeholder: 'E.g. Red, Blue',
              required: true,
              type: 'text'
            }
          }
        }
      }
    }

All field objects have the following properties, which must be defined:

- **enabled** - Determines if the field is shown on the form.

- **label** - The text label that is shown to the left of the input field.

- **name** - The name of this field, in the form model that is posted to the
  server.

- **placeholder** - The help text that is shown inside the input field, if the
  input field is empty (HTML5 property).

- **required** - Marks the field as a required field.  This uses the HTML5
  required property, to prompt the user to enter the value.  The post data will
  also be validated to ensure that the field is supplied, and an error will be
  returned if the field is empty.

- **type** - the HTML type of the input, e.g. text, email, or password.


Changing Field Order
--------------------

If you want to change the order of the fields, you can do so by specifying the
``fieldOrder`` array::

    web: {
      register: {
        form: {
          fieldOrder: [ 'givenName', 'surname', 'email', 'password' ]
        }
      }
    }

Password Strength Rules
-----------------------

Stormpath supports complex password strength rules, such as number of letters
or special characters required.  These settings are controlled on a directory
basis.  If you want to modify the password strength rules for your application
you should use the `Stormpath Admin Console`_ to find the directory that is mapped
to your application, and modify it's password policy.

For more information see `Account Password Strength Policy`_.

.. _email_verification:

Email Verification
------------------

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
----------

If you are *not* using email verificaion (not recommended) you may log users in
automatically when they register.  This can be achieved with this config::

    web: {
      register: {
        autoLogin: true,
        nextUri: '/'
      }
    }

By default the nextUri is to the `/` page, but you can modify this.

.. _pre_registration_handler:

Pre Registration Handler
------------------------

Want to validate or modify the form data before it's handled by us? Then this is
the handler that you want to use!

To use a ``preRegistrationHandler`` you need to define your handler function in
the Stormpath middleware setup::

    app.use(stormpath.init(app, {
      preRegistrationHandler: function (formData, req, res, next) {
        console.log('Got registration request', formData);
        next();
      }
    }));

As you can see in the example above, the ``preRegistrationHandler`` function
takes in four parameters:

- ``formData``: The data submitted in the form.
- ``req``: The Express request object.  This can be used to modify the incoming
  request directly.
- ``res``: The Express response object.  This can be used to modify the HTTP
  response directly.
- ``next``: The callback to call after you have done your custom work.  If you
  call this with an error then we immediately return this error to the user and
  form processing stops.  But if you call it without an error, then our library
  will continue to process the form and respond with the default behavior.

In the example below, we'll use the ``preRegistrationHandler`` to validate that
the user doesn't enter an email domain that is restricted::

    app.use(stormpath.init(app, {
      preRegistrationHandler: function (formData, req, res, next) {
        if (formData.email.indexOf('@some-domain.com') !== -1) {
          return next(new Error('You\'re not allowed to register with \'@some-domain.com\'.'));
        }

        next();
      }
    }));

.. _post_registration_handler:

Post Registration Handler
-------------------------

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
      postRegistrationHandler: function (account, req, res, next) {
        console.log('User:', account.email, 'just registered!');
        next();
      }
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
      postRegistrationHandler: function (account, req, res, next) {
        res.redirect(302, '/secretpage').end();
      }
    }));

.. _json_registration_api:

JSON Registration API
---------------------

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
will get an object that looks like ``{ message: 'error message here'}``.

If you make a GET request to the registration endpoint, with ``Accept:
application/json``, we will send you a JSON view model that describes the
registration form and the social account stores that are mapped to your
Stormpath Application.  Here is an example view model that shows you an
application that has a default registration form, and a mapped Google
directory:

.. code-block:: javascript

  {
    "accountStores": [
      {
        "name": "express-stormpath google",
        "href": "https://api.stormpath.com/v1/directories/gc0Ty90yXXk8ifd2QPwt",
        "provider": {
          "providerId": "google",
          "clientId": "441084632428-9au0gijbo5icagep9u79qtf7ic7cc5au.apps.googleusercontent.com",
          "scope": "email profile",
          "href": "https://api.stormpath.com/v1/directories/gc0Ty90yXXk8ifd2QPwt/provider"
        }
      }
    ],
    "form": {
      "fields": [
        {
          "label": "First Name",
          "placeholder": "First Name",
          "required": true,
          "type": "text",
          "name": "givenName"
        },
        {
          "label": "Last Name",
          "placeholder": "Last Name",
          "required": true,
          "type": "text",
          "name": "surname"
        },
        {
          "label": "Email",
          "placeholder": "Email",
          "required": true,
          "type": "email",
          "name": "email"
        },
        {
          "label": "Password",
          "placeholder": "Password",
          "required": true,
          "type": "password",
          "name": "password"
        }
      ]
    }
  }

.. note::

  You may have to explicitly tell your client library that you want a JSON
  response from the server. Not all libraries do this automatically. If the
  library does not set the ``Accept: application/json`` header on the request,
  you'll get back the HTML registration form - not the JSON response that you
  expect.

.. _Stormpath Admin Console: https://api.stormpath.com
.. _Account Password Strength Policy: https://docs.stormpath.com/rest/product-guide/#account-password-strength-policy
