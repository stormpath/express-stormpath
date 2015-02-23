.. _protect_api:

Securing the API
====================

Our skeleton application contains a simple API, it serves a list of things (you saw this when you ran ``grunt serve`` for the first time).  We will use Stormpath to secure this simple API


Add the default middleware
---------------------------

Find the file ``server/routes.js``

This file is attaching some routes to the Express application that is setup in ``server/app.js``

We want to initialize the Stormpath middleware and add it before our API declarion, so that the API will be automatically protected.

Add this line before `module.exports`::

    var spMiddleware = stormpathExpressSdk.createMiddleware();

Then inside the module.exports, before any other `app` statements::

    app.use(spMiddleware);


Reload the app
---------------

Restart the server if it does not automaticaly, then reload the application in the browser.  You should now see that the features are no longer listed - this is because the endpoint fails to load with a 401 Unauthorized - you can see this by looking inside the web console in your browser:

.. image:: _static/features-unauthorized.png


Our API is now protected from unauthorized, anonymous access.  In the next two sections we will show you how to create a registration form and a login form.  At that point you will be able to login and have access to the API.