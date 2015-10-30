.. _authorization:


Authorization
=============

Stormpath supports extremely complex authorization rules.  This section aims to
provide a basic introduction to Express-Stormpath's authorization enforcement
(*this topic is covered in-depth later on*).

The main authorization resource in Stormpath is the ``Group``.  A Stormpath
Group is a named resource (*admins, developers, paid users, free users, etc.*)
which can be assigned to any number of user accounts.


Group-based Access Control
--------------------------

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

    app.get('/admins', stormpath.groupsRequired(['admins']), function (req, res) {
      res.send('If you can see this page, you must be in the `admins` group!');
    });

If a user tries to visit ``/admins``, they'll get redirected to the login page
and won't be able to access the view.

What if we wanted to build a view only accessible to users who are both free
users and admins?  In this case we could just list both required groups::

    app.get('/free_users_and_admins', stormpath.groupsRequired(['free users', 'admins']), function (req, res) {
      res.send('If you can see this page, you must be in the `free users` and `admins` group!');
    });

Now that you've seen how you can require a user to be a member of multiple
groups, let's take a look at how you can enforce selective group membership::

    app.get('/any_user', stormpath.groupsRequired(['free users', 'paid users', 'admins'], false), function (req, res) {
      res.send('If you can see this page, you must be in at least one of the specified groups!');
    });

The view above lists three groups, and sets the ``all`` parameter to ``false``
-- signifying that a user must be a member of **at least one** of the listed
groups in order to gain access.


.. _Directory Dashboard: https://api.stormpath.com/ui2/index.html#/directories
.. _createGroup: http://docs.stormpath.com/nodejs/api/directory#createGroup
