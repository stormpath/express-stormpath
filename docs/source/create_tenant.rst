.. _create_tenant:

Create a Stormpath Tenant
==============================

If you have already signed up for Stormpath, you can skip this section and continue
to the next one (you will still need to fetch your API Keys and App Href that you
want to use with this project).

Sign up for Stormpath
---------------------

Now that you're ready to integrate Stormpath, the first thing you'll want to do is
create a new Stormpath account by visiting https://api.stormpath.com/register .

We'll send you an email verification message, please verify it and then you can
login to the `Stormpath Admin Console`_.

Create an API Key Pair
----------------------

Once you've logged into the `Stormpath Admin Console`_, click the "Manage API Keys" button on your home page.
This will allow you to generate a new API key, it will prompt you to download your keypair.

.. note::
    Please keep the API key pair file you just downloaded safe!  These two keys
    allow you to make Stormpath API requests, and should be properly protected.

.. _Stormpath Admin Console: https://api.stormpath.com/login

Create a Stormpath Application
------------------------------

Next, you'll want to create a new Stormpath Application.

Stormpath allows you to provision any number of "Applications".  An "Application" is just Stormpath's term for a project.

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
    Use the default options when creating an Application. This way you'll be
    able to create users in your new Application without issue.
