.. _wait_for_user:

Waiting For User State
=======================

Now that we have a complete application, you should play around with it!

As you do, you may find something annoying:  our menu bar has a bit of
a "flash" to it: even if we are logged in, it will momentarily show
as if we are not logged in.  This happens while we're fetching the information
about the current user.

You'll only see this on the main view, you won't see it on the Profile
view because that is an authenticated route.

How do we solve this problem?

Use the waitForUser option
---------------------------

The anwer is incredibly simple, just use the ``waitForUser`` option on
the state configuration!

With this option we will defer the rendering of the view, but won't
go to the login page if the user is not logged in.  We'll continue to
the view, but the current user state will be resolved either way.  This
allows our templates to render properly and immediately once the state
is known.

Open the file ``client/app/main/main.js`` and add this option to the
state configuration::

    .state('main', {
      url: '/',
      templateUrl: 'app/main/main.html',
      controller: 'MainCtrl',
      sp:{
        waitForUser: true
      }
    });

That's it!  When you reload your app, you'll see a white page for a moment
and then everything will render with the proper user state.

If you have a complex bootstrap process and want to show some kind of loading
overlay while the application is bootstrapping, you may find the
`whileResolvingUser <https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.whileResolvingUser:while-resolving-user>`_.
directive of use.