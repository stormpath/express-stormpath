.. _user_data:

User Data
=========


req.user
--------

If you are writing your own middleware functions, you will likely want to use
the account object.  There are two primary ways to do this: with the `getUser`
middleware, and with our other authentication middleware.

.. _getUser:

Resolving The Current User
..........................

In this situation, we have a home page which needs to render itself differently
if the user is logged in.  In this scenario, we don't *require* authentication,
but we need to know if the user is logged in.  In this case we use the
``getUser`` middleware:

  .. code-block:: javascript

    // Homepage route handler

    app.get('/', stormpath.getUser, function (req, res) {
      if (req.user) {
        res.send('Hello, ' + req.user.email);
      } else {
        res.send('Not logged in');
      }
    });

Forcing Authentication
......................

If you require authentication for a route, you should use one of the
authentication middleware functions that are documented in the
:ref:`authentication` section.

When you use these middlewares, we won't call your middleware function unless the
user is logged in.  If the user is not logged in, we bypass your middleware and
redirect the user to the login page for HTML requests, or send a 401 error for
JSON requests.

For example, if you've defined a simple view that should simply display a user's
email address, we can use the ``loginRequired`` middleware to require them to be
logged in, and show them their email if so:

    .. code-block:: javascript

      app.get('/email', stormpath.loginRequired, function (req, res) {
        res.send('Your email address is: ' + req.user.email);
      });

Modifying The User
..................

The ``req.user`` context allows you to directly interact with the current
``user`` object.  This means you can perform *any* action on the ``user`` object
directly.  For a full list of actions, see the `Account Object`_ in the `Stormpath Node SDK`_

Perhaps you want to change a user's ``givenName`` (*first name*).  You could
easily accomplish this with the following code::

    req.user.givenName = 'Randall';
    req.user.save(function (err) {
      if (err) {
        res.status(400).end('Oops!  There was an error: ' + err.userMessage);
      }else{
        res.end('Name was changed!');
      }
    });

As you can see above, you can directly modify ``user`` attributes, then
save any changes by running ``req.user.save()``.


Custom Data
-----------

In addition to managing basic user fields, Stormpath also allows you to store
up to 10MB of JSON information with each user account!

Instead of defining a database table for users, and another database table for
user profile information -- with Stormpath, you don't need either!

Let's take a look at how easy it is to store custom data on a ``user``
model::

    // You can add fields
    req.user.customData.somefield = 'somevalue';
    req.user.customData['anotherfield'] = {'json': 'data'};
    req.user.customData['woot'] = 10.202223;
    req.user.customData.save();

    // And delete fields

    delete req.user.customData['woot'];

    // And then save it all at once

    req.user.customData.save(function (err) {
      if (err) {
        res.status(400).end('Oops!  There was an error: ' + err.userMessage);
      }else{
        res.end('Custom data was saved!');
      }
    });

As you can see above -- storing custom information on a ``user`` account is
extremely simple!


Automatic Expansion
-------------------

In Stormpath, all objects are connected in a graph.  You
have to expand a resource to get its child resources, and this
is an asynchronous operation.  We can pre-fetch the expanded
user data for you.  Simply use the `expand` config option::

    app.use(stormpath.init(app, {
      expand: {
        customData: true,
      }
    });

Our library will pre-expand those resources for you, so that
they are statically available inside your handler::

    app.get('/', stormpath.loginRequired, function (req, res) {
      res.json(req.user.customData);
    });

Without enabling this expansion, the response would only contain
an object which has an href to the resource, that would look
like this::

    {
      href: 'http://api.stormpath.com/v1/accounts/avIu4NrfCk49uzhfCk/customData'
    }

.. note::

 Custom data is expanded automatically, but you can disable this

You can expand any of these *"linked resources"*:

- ``apiKeys`` - A user's API keys.
- ``customData`` - A user's custom data.
- ``directory`` - A user's directory data.
- ``groups`` - A user's group data.
- ``groupMemberships`` - A user's group membership data.
- ``providerData`` - A user's provider data (*for social login providers*).
- ``tenant`` - A user's tenant data.


Collections
-----------

Some of the linked resources are collections -- and they can't be queried in a single request.

Take ``groups``, for instance, if your account is a member of 1,000 groups, you
won't be able to squeeze all 1,000 groups into a single object (*it's just not
efficient*) -- so instead, you have to iterate over the collection.

Below is an example which shows how you can iterate over a collection resource
(*groups, in this case*)::

    app.get('/', stormpath.loginRequired, function (req, res) {
      req.user.groups.each(function iterator(group, cb) {
        console.log('group:', group);
        cb();
      }, function done() {
        res.send('Finished logging all groups to the console!')
      });
    });

Each collection resource has an ``each`` method which takes in two functions
with signature: ``function (data, callback), function ()``.  The first function
will be called for each resource in the collection.  The second function will be
called when you've finished iterating through all of the available resources.

So, given the example above, we could just as easily iterate over all of a
user's ``apiKeys``::

    app.get('/', stormpath.loginRequired, function (req, res) {
      req.user.apiKeys.each(function (apiKey, callback) {
        console.log('apiKey:', apiKey);
        callback();
      }, function () {
        res.send('Finished logging all apiKeys to the console!')
      });
    });


.. _me_api:

Current User JSON API
---------------------

If you are working with a front-end application, you can make a request to the
``/me`` URL to get a JSON representation of the account that is currently
logged in.  If the user is not logged in, this endpoint will return a 401
response.

The response from the endpoint looks like this:

.. code-block:: javascript

  {
    "account": {
      "href": "https://api.stormpath.com/v1/accounts/4WvCtY0oCRDzQdYH3Q0qjz",
      "username": "foobar",
      "email": "foo@example.com",
      "givenName": "Foo",
      "middleName": null,
      "surname": "Bar",
      "fullName": "Foo Bar",
      "status": "ENABLED",
      "createdAt": "2015-10-13T20:54:22.215Z",
      "modifiedAt": "2016-03-17T16:40:17.631Z"
    }
  }

By default we don't expand any data on the account, for security purposes.  But
you can opt-in to account expansions with the following configuration:

.. code-block:: javascript

  app.use(stormpath.init(app, {
    web: {
      me: {
        expand: {
          customData: true
        }
      }
    }
  });

If you wish to disable the ``/me`` route entirely, you can do that as well:

.. code-block:: javascript

  app.use(stormpath.init(app, {
    web: {
      me: {
        enabled: false
      }
    }
  });


.. _Account Object: http://docs.stormpath.com/nodejs/api/account
.. _Stormpath Node SDK: http://github.com/stormpath/stormpath-sdk-node
