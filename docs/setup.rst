.. _setup:


Setup
=====

This section walks you through the basic setup for Express-Stormpath, by the end
of this page you'll have setup the login and registration features for your
Express application!

Create a Stormpath Account
--------------------------

Now that you've decided to use Stormpath, the first thing you'll want to do is
create a new Stormpath account: https://api.stormpath.com/register


Create an API Key Pair
----------------------

Once you've created a new account you need to create a new API key pair. A new
API key pair is easily created by logging into your dashboard and clicking the
"Create an API Key" button. This will generate a new API key for you, and
prompt you to download your key pair.

.. note::
    Please keep the API key pair file you just downloaded safe!  These two keys
    allow you to make Stormpath API requests, and should be properly protected,
    backed up, etc.

Once you've downloaded your `apiKey.properties` file, save it to the following
location in your home directory:

.. code-block:: sh

    ~/.stormpath/apiKey.properties

To ensure no other users on your system can access the file, you'll also want to
change the file's permissions. You can do this by opening up your terminal and
running:

.. code-block:: sh

    $ chmod go-rwx ~/.stormpath/apiKey.properties

For the rest of this tutorial, we'll assume that you've placed this file in that
location. If you prefer to expose options with environment variables or
configuration options, you can do that too! Please see the :ref:`configuration`
section for other options.

Find Your Stormpath Application
-------------------------------

All new Stormpath Tenants will have a Stormpath Application, called
"My Application". You'll generally want one application per project, and we can
use this default application to get started.

An application has an HREF, and it looks like this:

.. code-block:: sh

    https://api.stormpath.com/v1/applications/24kkU5XOz4tQlZ7sBtPUN6

From inside the `Admin Console`_, you can find the HREF by navigating to the
Application in the Application's list.

To learn more about Stormpath Applications, please see the
`Application Resource`_ and
`Setting up Development and Production Environments`_

.. note::
    Your default Application will also have a directory mapped to it. The
    Directory is where Stormpath stores accounts. To learn more, please see
    `Directory Resource`_ and `Modeling Your User Base`_.


Now that you've created an Application, you're ready to plug Express-Stormpath
into your project!

Install the Package
-------------------

Now that you've got a Stormpath account all setup and ready to go, all that's
left to do before we can dive into the code is install the `Express-Stormpath`_
package from `NPM`_.

To install Express-Stormpath, you'll need ``npm``.  You can install the latest
version of Express-Stormpath by opening up your terminal and running::

    $ npm install express-stormpath --save

If you'd like to upgrade to the latest version of Express-Stormpath (*maybe you
have an old version installed*), you can run::

    $ npm update express-stormpath

.. note::
    Express-Stormpath is currently *only* compatible with Express 4.x.




Initialize Express-Stormpath
----------------------------

With the module installed, we can add it to our application. Here is a sample
Express application, it shows the minimal code required to integrate Stormpath:

 .. code-block:: javascript

    var express = require('express');
    var stormpath = require('express-stormpath');

    var app = express();

    app.use(stormpath.init(app, {
      // Optional configuration options.
    }));

    app.listen(3000);

    // Stormpath will let you know when it's ready to start authenticating users.
    app.on('stormpath.ready', function () {
      console.log('Stormpath Ready!');
    });

With this minimal configuration, our library will do the following:

- Fetch your Stormpath Application and all the data about its configuration and
  account stores.

- Attach the :ref:`default_features` to your express application, such as the
  login page and registration page.

- Hold any requests that require authentication, until Stormpath is ready.

That's it, you're ready to go! Try navigating to these URLs in your application:

- http://localhost:3000/login
- http://localhost:3000/register

You should be able to register for an account and log in. The newly created
account will be placed in the directory that is mapped to "My Application".

.. note::

    By default, we don't require email verification for new accounts, but we
    highly recommend you use this workflow. You can enable email verification
    by logging into the `Admin Console`_ and going to the the Workflows tab
    for the directory of your Stormpath Application.

There are many more features than login and registration, please continue to the
next section to learn more!


Example Applications
--------------------

Looking for some example applications?  We provide the following examples
applications to get you up and running quickly.  They show you how to setup
Stormpath, and implement a profile page for the logged-in user:

- `Express-Stormpath Example Project`_

- `Stormpath Angular + Express Fullstack Sample Project`_

- `Stormpath React + Express Fullstack Example Project`_

.. _Admin Console: https://api.stormpath.com/login
.. _Application Resource: https://docs.stormpath.com/rest/product-guide/latest/reference.html#application
.. _Active Directory: http://en.wikipedia.org/wiki/Active_Directory
.. _Directory Resource: https://docs.stormpath.com/rest/product-guide/latest/reference.html#directory
.. _Express-Stormpath Example Project: https://github.com/stormpath/express-stormpath-sample-project
.. _LDAP: http://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol
.. _Express-Stormpath: https://www.npmjs.org/package/express-stormpath
.. _Modeling Your User Base: https://docs.stormpath.com/rest/product-guide/latest/accnt_mgmt.html#modeling-your-user-base
.. _NPM: https://www.npmjs.org/
.. _Setting up Development and Production Environments: https://docs.stormpath.com/guides/dev-test-prod-environments/
.. _Stormpath Angular + Express Fullstack Sample Project: https://github.com/stormpath/express-stormpath-angular-sample-project
.. _Stormpath React + Express Fullstack Example Project: https://github.com/stormpath/stormpath-express-react-example