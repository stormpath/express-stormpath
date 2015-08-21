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



Using ID Site
----------------

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
..............

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