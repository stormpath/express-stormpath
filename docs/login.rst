.. _login:

Login
======

This library can serve a login page for your application, this will happen
if you opt into the ``{ web: true }`` configuration.  By default the login page
will be availble at this URL:

http://localhost:3000/login

Next URI
---------

The form will render with two fields for username and passsowrd, and this form
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

JSON API
---------

If you want to make a login attempt from a front-end application (Angular, React),
simply post a JSON body to the ``/login`` endpoint, with the following format::

    {
      "username": "foo@bar.com",
      "password": "myPassword"
    }

If the login attempt is successful, you will recieve a 200 OK response.  If
there is an error we will send a 400 status with an error message in the body.
