.. _configure_angular:

Configure the Angular App
--------------------------------

There are a few things we need to setup before we can build the
rest of the application.  We need to add the Stormpath modules as
dependencies of our application, and we need to configure some of the
magic that will happen with the `UI Router`_ module.

Add Stormpath to the Angular Application
==========================================

We need to manually declare the Stormpath Angular SDK as a module
in the Angular app.

Open the file ``client/app/app.js`` and modify the module list
to have these two Stormpath dependencies at the end of the list::

    angular.module('dashboardApp', [
      'ngCookies',
      'ngResource',
      'ngSanitize',
      'ui.router',
      'stormpath',
      'stormpath.templates'
    ])

Configure the UI Router Integration
===================================

Our Angular SDK is designed to work with the third-party `UI Router`_ module (support
for Angular's built-in router will be coming in a future release).  Before we
add anything else to our application we need to setup the `UI Router`_ integration.

.. note::
  We *highly* recommend the UI Router module, over the Angular built-in router.  It
  provides a very good way for organizing your Angular application.

In the same ``app.js`` file you want to add this run block, place
it below the ``.config`` block (make sure you move the semicolon
from the config block to the run block)::


    .run(function($stormpath){
      $stormpath.uiRouter({
        loginState: 'login',
        defaultPostLoginState: 'main'
      });
    });

This configures the integration to do the following:

* Redirect users to the ``login`` view if they try to access a restricted view. After logging in, they are sent back to the view that they originally requested.
* Send users to the ``main`` view after login if they have visited the login page directly (they did not try to access a restricted view first).

With that we are ready to start working on the views!  Continue to the next section,
where we begin by modifying the menu bar to include links for Login and Registration

.. _UI Router: https://github.com/angular-ui/ui-router
