.. _password_reset:


Password Reset
==============

Stormpath provides a self-service password reset flow for your users, allowing
them to request a link that lets them reset their password.  This is a very
secure feature and we highly suggest it for your application.


Enable the Workflow
-------------------

To use the password reset workflow, you need to enable it on the directory
that your application is using.  Login to the `Stormpath Admin Console`_ and
find your directory, then navigate to the workflows section of that directory.

Enable the password reset email if it is disabled.

You should also set the **Link Base Url** to be the following URL:

 .. code-block:: sh

    http://localhost:3000/change


Using the Workflow
------------------

After enabling the workflow, restart your Express application.  You can now
complete a password reset workflow by doing the following steps:

* The login form at ``/login`` will show a "Forgot Password?" link.
* Clicking that link will take you to ``/forgot``, where you can ask for a password reset email
* After you receive the email, clicking on the link will take you to ``/change``
* You'll see a form that allows you to change your password
* After changing your password, you are taken to the login form


Auto Login
----------

Our library implements the most secure workflow by default: the user must
request a password reset link, then login again after changing their password.
We recommend these settings for security purposes, but if you wish to automatically
log the user in after they reset their password you can enable that functionality
with this option::

    {
      web: {
        changePassword: {
          autoLogin: false,
        }
      }
    }


Customizing the UX
------------------

You may also change the URLs of the pages in this workflow, as well as the
redirect URLs that we use during the workflow.  This example configuration shows
the default options that you can modify to suit your needs::

    {
      web: {
        forgotPassword: {
          enabled: false,
          uri: "/forgot",
          view: "forgot-password",
          nextUri: "/login?status=forgot"
        },
        changePassword: {
          enabled: false,
          autoLogin: false,
          uri: "/change",
          nextUri: "/login?status=reset",
          view: "change-password",
          errorUri: "/forgot?status=invalid_sptoken"
        }
      }
    }


.. _Stormpath Admin Console: https://api.stormpath.com
