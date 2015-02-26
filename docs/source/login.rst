.. _login:

Create the /login route
============================

Like we did with the Registration page, we will use the generator
to create the login route.

Stop the server and run this command in your project folder, pressing
enter to choose all the default options when it asks::

    $ yo angular-fullstack:route login

Use the Login Form Directive
--------------------------------

We're going to use the default login form that ships with the
Stormpath Angular SDK

Open the file ``client/app/login/login.html`` and then replace
it's contents with this::

    <div ng-include="'components/navbar/navbar.html'"></div>

    <div class="container">
      <div class="row">
        <div class="col-xs-12">
          <h3>Login</h3>
          <hr>
        </div>
      </div>
      <div sp-login-form></div>
    </div>

This is a small bit of HTML markup which does the following:

* Includes the common menu bar for the application (we customized it in the last section)
* Sets up some bootstrap classes so that the page flows nicely
* Inserts the default login form, via the ``sp-login-form`` directive

Save that file and the browser should auto reload, you should now
see the login route like this:

.. image:: _static/login_form.png


If you want to further customize the look and behaviour of the form,
please see the API documentation of for
`sp-login-frorm <https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spLoginForm:sp-login-form>`_.
The most useful feature is the ability to specify your own template.