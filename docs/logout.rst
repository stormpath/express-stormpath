.. _logout:


Logout
======

If you are using browser-based sessions, you'll need a way for the user to
logout and destroy their session cookies.

By default this library will automatically provide a POST route at ``/logout``.
Simply make a POST request to this URL and the session cookies will be
destroyed.

Configuration Options
---------------------

If you wish to change the logout URI or the redirect url, you can provide the
following configuration::

    web: {
      logout: {
        enabled: true,
        uri: '/log-me-out',
        nextUri: '/goodbye'
      }
    }

.. _post_logout_handler:

Post Logout Handler
------------------

Want to run some custom code after a user has logged out of your site?
By defining a ``postLogoutHandler`` you're able to do just that!

To use a ``postLogoutHandler``, you need to define your handler function
in the Stormpath config::

    app.use(stormpath.init(app, {
      postLogoutHandler: function (account, req, res, next) {
        console.log('User', account.email, 'just logged out!');
        next();
      }
    }));

As you can see in the example above, the ``postLogoutHandler`` function
takes four parameters:

- ``account``: The successfully logged out user account.
- ``req``: The Express request object.  This can be used to modify the incoming
  request directly.
- ``res``: The Express response object.  This can be used to modify the HTTP
  response directly.
- ``next``: The callback to call when you're done doing whatever it is you want
  to do.  If you call this, execution will continue on normally.  If you don't
  call this, you're responsible for handling the response.

In the example below, we'll use the ``postLogoutHandler`` to redirect the
user to a special page (*instead of the normal logout flow*)::

    app.use(stormpath.init(app, {
      postLogoutHandler: function (account, req, res, next) {
        res.redirect(302, '/farewell').end();
      }
    }));
