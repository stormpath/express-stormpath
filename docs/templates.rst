.. _templates:


Templates
=========


Default Views
-------------

By default this library will use it's own templates for rendering its views.
The views that this library serves by default (if the features are enabled) are:

* Login Page
* Registration Page
* Forgot Password Page
* Change Password Page
* Email Verifiation Page

If you want to customize these pages, there are two strategies.  You can copy
our default templates and modify them, or you can supply your own


Custom Views
------------

If you want to supply your own view for a given feature, you need to let us
know where it is.  You do this by telling us the specific path to the file.
For example, if you had a folder named ``views`` in the root of your project,
you would declare it like this::

    {
      web: {
        login: {
          view: path.join(__dirname,'views','login.ejs') // My custom login view
        }
      }
    }

If you wish to copy and modify our default views, you can find our default views
in the source code: https://github.com/stormpath/stormpath-express/tree/master/lib/views

.. note::

  Our library includes Jade and our default templates are written in Jade.  If you
  are using custom templates that are not written in Jade, you must enable a
  view renderer in your Express application.  Please see
  `Using template engines with Express`_.


View Variables
--------------

Our library will probivde these view locals to all templates that are
rendered by this library:

+-----------------+-------------------------------------------------------------------+
| **Variable**    | **Description**                                                   |
+-----------------+-------------------------------------------------------------------+
| user            | The account object of the logged in user (undefined otherwise)    |
+-----------------+-------------------------------------------------------------------+
| stormpathConfig | The Stormpath config that you passed to the ``init`` middleware,  |
|                 | it also holds information about which directory features you have |
|                 | enabled (such as email verification and password reset)           |
+-----------------+-------------------------------------------------------------------+


If you are letting our library render your view (default or custom) you may
want to pass some extra locals to the renderer.  You can do that with the
``templateContext`` option::

    app.use(stormpath.init(app, {
      templateContext: {
        extraData: 'This is extra data.',
        googleAnalyticsID: 'UA-0000000-1',
        mixpanelID: '123456'
      }
    }));

Or, if you prefer environment variables::

    $ export STORMPATH_CLIENT_TEMPLATE_CONTEXT='{"googleAnalyticsCode": "UA-XXX-XX", "intercomId": "xxx"}'


Request Variables
-----------------

If you are rendering templates outside of our library, you can can get information
about the Stormpath configuration from the Express application, like so:

+-------------------------------------+------------------------------------------------------------------+
| **Accessor**                        | **Description**                                                  |
+-------------------------------------+------------------------------------------------------------------+
| req.app.get('stormpathConfig')      | The Stormpath config that you passed to the ``init`` middleware, |
|                                     | it also holds information about which directory features you have|
|                                     | enabled (such as email verification and password reset)          |
+-------------------------------------+------------------------------------------------------------------+
| req.app.get('stormpathApplication') | The Stormpath Application that is being used                     |
+-------------------------------------+------------------------------------------------------------------+

.. note::

  The value ``stormpathApplication`` won't be available until the
  ``app.on('stormpath.ready')`` event has been fired.  As such, you should wait
  for this event or place the ``stormpath.getUser`` middleware in front of your
  custom middlware, as it will also wait for this event to fire.


Response Variables
------------------

Our library will probivde these objects on the response object

==========  ==========
Variable    Description
==========  ==========
user        The account object of the logged in user (undefined otherwise)
==========  ==========


.. _Using template engines with Express: http://expressjs.com/guide/using-template-engines.html
