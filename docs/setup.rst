.. _setup:


Setup
=====

This section covers the basic setup you need to perform in order to get started
with Express-Stormpath.


Create a Stormpath Account
--------------------------

Now that you've decided to use Stormpath, the first thing you'll want to use is
create a new Stormpath account: https://api.stormpath.com/register


Create an API Key Pair
----------------------

Once you've created a new account, create a new API key pair by logging into
your dashboard and clicking the "Create an API Key" button.  This will generate
a new API key for you, and prompt you to download your keypair.

.. note::
    Please keep the API key pair file you just downloaded safe!  These two keys
    allow you to make Stormpath API requests, and should be properly protected,
    backed up, etc.

Once you've downloaded your `apiKey.properties` file, save it in your home
directory in a file named `~/.stormpath/apiKey.properties`.  To ensure no other
users on your system can access the file, you'll also want to change the file's
permissions.  You can do this by running::

    $ chmod go-rwx ~/.stormpath/apiKey.properties


Create a Stormpath Application
------------------------------

Next, you'll want to create a new Stormpath Application.

Stormpath allows you to provision any number of "Applications".  An
"Application" is just Stormpath's term for a project.

Let's say you want to build a few separate websites.  One site named
"dronewars.com", and another named "carswap.com".  In this case, you'd want to
create two separate Stormpath Applications, one named "dronewars" and another
named "carswap".  Each Stormpath Application should represent a real life
application of some sort.

The general rule is that you should create one Application per website (or
project).  Since we're just getting set up, you'll want to create a single
Application.

To do this, click the "Applications" tab in the Stormpath dashboard, then click
"Register an Application" and follow the on-screen instructions.

.. note::
    Use the default options when creating an Application, this way you'll be
    able to create users in your new Application without issue.

Now that you've created an Application, you're ready to plug Express-Stormpath
into your project!


Bonus: Create a Directory
-------------------------

As you might have noticed, Stormpath also has something called "Directories".
When you created an Application in the previous step, Stormpath automatically
created a new Directory for you.

You can think of Directories in Stormpath as buckets of user accounts.  Every
user account that you create on Stormpath will belong to a Directory.
Directories hold unique groups of users.

In most situations, your Stormpath Application will have a single Directory
associated with it which is where all of your users will go.  In some
situations, however, you might want to create additional Directories (or share a
Directory between multiple Applications).

Let's say you have two separate websites (*and therefore, two separate Stormpath
Applications*): "dronewars.com" and "carswap.com".  If you wanted both of your
websites to share the same user accounts (*so that if a user signs up on
dronewars.com they can use their same login on carswap.com*), you could
accomplish that by having a single Directory, and mapping it to both of your
Stormpath Applications.

Directories are useful for sharing and segmenting users in more complex
authentication scenarios.

You can read more about Stormpath Directories here:
http://docs.stormpath.com/rest/product-guide/#directories

.. note::
    Stormpath has multiple types of "Directories".  There are: "Cloud
    Directories", "Mirror Directories", "Facebook Directories" and "Google
    Directories".

    Cloud Directories hold *typical* user accounts.

    Facebook and Google Directories allow you to automatically create Stormpath
    user accounts for both Facebook and Google users (*using social login*).
    Social login will be covered in detail later on.

    Mirror Directories are used for syncing with `Active Directory`_ and
    `LDAP`_ services (most people don't ever need these).


Install the Package
-------------------

Now that you've got a Stormpath account all setup and ready to go, all that's
left to do before we can dive into the code is install the `Express-Stormpath`_
package from `NPM`_.

To install Express-Stormpath, you'll need ``npm``.  You can install the latest
version of Express-Stormpath by running::

    $ npm install express-stormpath

If you'd like to upgrade to the latest version of Express-Stormpath (*maybe you
have an old version installed*), you can run::

    $ npm update express-stormpath

To force an upgrade.

.. note::
    Express-Stormpath is currently *only* compatible with Express 4.x.


.. _Active Directory: http://en.wikipedia.org/wiki/Active_Directory
.. _LDAP: http://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol
.. _Express-Stormpath: https://www.npmjs.org/package/express-stormpath
.. _NPM: https://www.npmjs.org/
