.. _customize_menu:

Customize the Menu
===================

Now that our Angular application is configured, let's get on with the building!

The first view we want to work with is the menu bar.  We want to have login
and registration links, as well as a link to the user profile view that we
will be building.

When the user is not logged in, we want the following to happen:

 * Show a link to the Registration page
 * Show a link to the Login page

But when they login, we want the following to happen:

 * Hide the links to the Registration and Login pages
 * Show a link to the Profile page (we'll build that in a later section)
 * Show a Logout link

Modify navbar.html
--------------------------

Open the file ``client/components/navbar/navbar.html`` and replace
the ``<ul>`` section with this markup::

  <ul class="nav navbar-nav">
    <li ng-repeat="item in menu" ng-class="{active: isActive(item.link)}">
        <a ng-href="{{item.link}}">{{item.title}}</a>
    </li>
    <li if-user ng-class="{active: isActive('/profile')}">
        <a ng-href="/profile">Profile</a>
    </li>
    <li if-not-user ng-class="{active: isActive('/register')}">
        <a ui-sref="register">Register</a>
    </li>
    <li if-not-user ng-class="{active: isActive('/login')}">
        <a ui-sref="login">Login</a>
    </li>
    <li if-user ng-class="{active: isActive('/logout')}">
        <a ui-sref="main" sp-logout>Logout</a>
    </li>
  </ul>

We've retained the piece that iterates over the default links, but we also
added the new links that we want.  We are using the
`ifUser`_ and `ifNotUser`_ directives to control the visibility of the links.

You can reload the app to see these changes, but the links will not work until
we complete the following sections in this guide.

.. _ifUser: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUser:ifUser
.. _ifNotUser: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifNotUser:ifNotUser