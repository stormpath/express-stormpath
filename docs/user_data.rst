.. _user_data:

User Data
=========


req.user
--------

If you are writing your own middleware functions, you will
likely want to use the account object.  If a user is logged in,
their account will be available on `req.user`.

Let's say we've defined a simple view that should simply display a user's email
address.  We can make use of the magical ``req.user`` context variable to
do this::

    app.get('/email', stormpath.loginRequired, function(req, res) {
      res.send('Your email address is: ' + req.user.email);
    });

The ``req.user`` context allows you to directly interact with the current
``user`` object.  This means you can perform *any* action on the ``user`` object
directly.  For a full list of actions, see the `Account Object`_ in the `Stormpath Node SDK`_

Perhaps you want to change a user's ``givenName`` (*first name*).  You could
easily accomplish this with the following code::

    req.user.givenName = 'Randall';
    req.user.save(function(err) {
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

    req.user.customData.save(function(err) {
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

    app.get('/', stormpath.loginRequired, function(req, res) {
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

    app.get('/', stormpath.loginRequired, function(req, res) {
      req.user.groups.each(function iterator(group, cb) {
        console.log('group:', group);
        cb();
      }, function done() {
        res.send('Finished logging all groups to the console!')
      });
    });

Each collection resource has an ``each`` method which takes in two functions
with signature: ``function(data, callback), function()``.  The first function
will be called for each resource in the collection.  The second function will be
called when you've finished iterating through all of the available resources.

So, given the example above, we could just as easily iterate over all of a
user's ``apiKeys``::

    app.get('/', stormpath.loginRequired, function(req, res) {
      req.user.apiKeys.each(function(apiKey, callback) {
        console.log('apiKey:', apiKey);
        callback();
      }, function() {
        res.send('Finished logging all apiKeys to the console!')
      });
    });


.. _Account Object: http://docs.stormpath.com/nodejs/api/account
.. _Stormpath Node SDK: http://github.com/stormpath/stormpath-sdk-node
