.. _access_control:

Access Control
===================

Parts of your application may only be available to certain users.
Stormpath provides Groups, which is a great way to segment users.

We provide some functionality, which makes it easy to make UI decisions
by looking at the groups that the account is a member of.


UI State Control
--------------------------

If you wish to prevent access to an entire UI State, you can define
a group authorization check in the state configuration.  In this example,
we are requiring that the user be in the Admins group::

    // Require a user to be in the admins group in order to see this state
    $stateProvider
      .state('admin', {
        url: '/admin',
        controller: 'AdminCtrl',
        sp: {
          authorize: {
            group: 'Admins'
          }
        }
      });

For more examples, see the `SpStateConfig documentation`_.

Helper Directives
--------------------------

If you need to show or hide specific elements in response to group state,
you can use the `ifUserInGroup`_ and `ifUserNotInGroup`_ directives. In
this example, we show a link to the Admin view if the user is in the admin
group.  If the user is not in the Admin group, we let them know that they
need to request access:

.. code-block:: html

  <ul class="nav navbar-nav">
    <li if-user-in-group="admins">
      <a ng-href="/admin">Admin Console</a>
    </li>
    <li if-user>
      <a ui-sref="main" sp-logout>Logout</a>
    </li>
  </ul>
  <div class="container">
    <h3>Hello, {{user.fullName}}</h3>
    <p if-user-not-in-group="admins">
      If you require Administrator access, please contact us.
    </p>
  </div>

API Security
--------------------------

Don't forget to secure your API!  While we provide these convenience
methods in AngularJS, you need to protect your server APIs as well.
If you are using our Express SDK, you can use the `groupsRequired Middleware`_
to help with this.


.. _ifUserInGroup: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUserInGroup:ifUserInGroup
.. _ifUserNotInGroup: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUserNotInGroup:ifUserNotInGroup
.. _groupsRequired Middleware: https://github.com/stormpath/stormpath-sdk-express#groupsRequired
.. _SpStateConfig documentation: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.SpStateConfig:SpStateConfig