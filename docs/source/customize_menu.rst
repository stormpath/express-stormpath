.. _customize_menu:

Customize the Menu
===================

Now that users can register for the system, let's get our menu setup
properly.  We want it to look differently when the user is logged in.

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
`ifUser <https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUser:if-user>`_
and
`ifNotUser <https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifNotUser:if-not-user>`_
directives to control the visibility of the links.

You can reload the app to see these changes, but the links to the Login
and Profile pages will be dead until we continue to the next two sections
of this guide.

Try It, and Logout!
--------------------------

After you save the file, the browser should reload and you'll see the
changes to the menu bar.  Click on the Logout button and you should see
that the menu bar changes to show that you're no longer logged in.

In the next section, we're going to build the Login route, so that you
can log back in!