.. _login:


Login
=====

By default this library will serve an HTML login page at ``/login``.  You can
change this URI with the ``web.login.uri`` option.  You can disable this feature
entirely by setting ``web.login.enabled`` to ``false``.

To view the default page in your example application, navigate to this URL:

http://localhost:3000/login

If the login attempt is successful, we will send the user to the Next URI and
create the proper session cookies.


Next URI
--------

The form will render with two fields for username and password, and this form
will be posted to ``/login``.  If login is successful, we will redirect the user
to ``/``.  If you wish to change this, use the ``nextUri`` config option::

    {
      web: {
        login: {
          enabled: true,
          nextUri: "/dashboard"
        }
      }
    }


Form Customization
------------------

The label and placeholder values can be changed by modifying the login form
field configuration:

.. code-block:: javascript

  {
    web: {
      login: {
        form: {
          fields: {
            login: {
              label: 'Your Username or Password',
              placeholder: 'email@trustyapp.com'
            },
            password: {
              label: 'Your super-secure PAssw0rd!'
            }
          }
        }
      }
    }
  }

.. _json_login_api:

JSON Login API
--------------

If you want to make a login attempt from a front-end application (Angular, React),
simply post a JSON body to the ``/login`` endpoint, with the following format::

    {
      "username": "foo@bar.com",
      "password": "myPassword"
    }

If the login attempt is successful, you will receive a 200 OK response and the
session cookies will be set on the response.  If there is an error we will
send a 400 status with an error message in the body.

If you make a GET request to the login endpoint, with ``Accept:
application/json``, we will send you a JSON view model that describes the login
form and the social account stores that are mapped to your Stormpath
Application.  Here is an example view model that shows you an application that
has a default login form, and a mapped Google directory:

.. code-block:: javascript

  {
    "accountStores": [
      {
        "name": "express-stormpath google",
        "href": "https://api.stormpath.com/v1/directories/gc0Ty90yXXk8ifd2QPwt",
        "provider": {
          "providerId": "google",
          "href": "https://api.stormpath.com/v1/directories/gc0Ty90yXXk8ifd2QPwt/provider",
          "clientId": "422132428-9auxxujR9uku8I5au.apps.googleusercontent.com",
          "scope": "email profile"
        }
      }
    ],
    "form": {
      "fields": [
        {
          "label": "Username or Email",
          "placeholder": "Username or Email",
          "required": true,
          "type": "text",
          "name": "login"
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

.. _pre_login_handler:

Pre Login Handler
-----------------

Want to validate or modify the form data before it's handled by us? Then this is
the handler that you want to use!

To use a ``preLoginHandler`` you need to define your handler function in the
Stormpath config::

    app.use(stormpath.init(app, {
      preLoginHandler: function (formData, req, res, next) {
        console.log('Got login request', formData);
        next();
      }
    }));

As you can see in the example above, the ``preLoginHandler`` function
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

In the example below, we'll use the ``preLoginHandler`` to validate that
the user doesn't enter an email domain that is restricted::

    app.use(stormpath.init(app, {
      preLoginHandler: function (formData, req, res, next) {
        if (formData.login.indexOf('@some-domain.com') !== -1) {
          return next(new Error('You\'re not allowed to login with \'@some-domain.com\'.'));
        }

        next();
      }
    }));

.. _post_login_handler:

Post Login Handler
------------------

Want to run some custom code after a user logs into your site?  By defining a ``postLoginHandler`` you're able achieve tasks like:

- Refresh a user's third-party services.
- Calculate the last login time of a user.
- Prompt a user to complete their profile, or setup billing.
- etc.

To use a ``postLoginHandler``, you need to define your handler function
in the Stormpath config::

    app.use(stormpath.init(app, {
      postLoginHandler: function (account, req, res, next) {
        console.log('User:', account.email, 'just logged in!');
        next();
      }
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
      postLoginHandler: function (account, req, res, next) {
        res.redirect(302, '/secretpage').end();
      }
    }));

Using ID Site
-------------

Stormpath provides a hosted login application, known as ID Site.  This feature
allows you to redirect the user to our hosted application.  When the user
authenticates, they will be redirected back to your application with an identiy
assertion.

This feature is useful if you don't want to modify your application to serve
web pages or single page apps, and would rather have that hosted somewhere else.

ID site looks like this:

.. image:: /_static/id-site-login.png

For more information about how to use and customize the ID site, please see
this documentation:

http://docs.stormpath.com/guides/using-id-site/

ID Site Configuration
.....................

If you wish to use the ID Site feature, you will need to log in to the
`Stormpath Admin Console`_ and configure the settings.  You need to change the
**Authorized Redirect Uri** setting and set it to
``http://localhost:3000/idSiteResult``

Then you want to enable ID Site in your express configuration::

    {
      web: {
        idSite: {
          enabled: true,
          uri: '/idSiteResult'    // default setting
          nextUri: '/'            // default setting
        }
      }
    }

When ID Site is enabled, any request for ``/login`` or ``/register`` will cause a
redirect to ID Site.  When the user is finished at ID Site they will be
redirected to `/idSiteResult` on your application.  Our library will handle
this request, and then redirect the user to the ``nextUri``.


.. _Stormpath Admin Console: https://api.stormpath.com
