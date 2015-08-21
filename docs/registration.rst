.. _registration:

Registration
=========================

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
