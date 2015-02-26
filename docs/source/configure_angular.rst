.. _configure_angular:

Configure the Angular App
--------------------------------

There are a few things we need to setup before we can get build the
rest of the application.  We need to add the Stormpath modules as
dependencies of our appliaion, and we need to configure some of the
magic that will happen with the UI Router module.

Add Stormpath to the Agnular Application
==========================================

We need to manually declare the Stormpath Angular SDK as a module
in the Angular app.

Open the file ``client/app/app.js`` and modify the module list
to look like so::

    angular.module('dashboardAppApp', [
      'ngCookies',
      'ngResource',
      'ngSanitize',
      'ui.router',
      'stormpath',
      'stormpath.templates'
    ])

Configure the UI Router integration
===================================

You're going to get the best bang for your buck if you use the
UI Router module: it's amazing.  So much so that we've built a
special integrationf or it.

In the same `app.js` file you want to add this run block, place
it below the ``.config`` block (make sure you move the semicolon
from the config block to the run block)::


    .run(function($stormpath){
      $stormpath.uiRouter({
        loginState: 'login',
        defaultPostLoginState: 'main'
      });
    });

This tells the integration to do the following:

* Redirect users to the ``login`` view if they try to access a restricted view. After login, they are sent back to the view that they originally requested
* Send users to the ``main`` view after login, if they have visited the login page directly

Let's move back to the server now:  in the next section we will secure our
API so that only authenticated users can use it