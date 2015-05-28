.. _login:

Create the Login Form
============================

Login forms are pretty straightforward, why re-invent the wheel? The `Stormpath
Angular SDK`_ includes a default login form that you can simply insert into your
application, via an Angular directive.  To use it we need to create a Login
route and view in our application.

Generate the /login Route
--------------------------------

We can use Yeomaon to create the Angular route and view at the same time.

Stop the server, then run the following command in your project folder::

    $ yo angular-fullstack:route login

It will ask you these questions, just hit enter to choose the defaults for all of them::

    ? Where would you like to create this route? client/app/
    ? What will the url of your route be? /login

It will then tell you about the files it has created::

  create client/app/login/login.js
  create client/app/login/login.controller.js
  create client/app/login/login.controller.spec.js
  create client/app/login/login.css
  create client/app/login/login.html

Use the Login Form Directive
--------------------------------

Open the file ``client/app/login/login.html`` and then replace
its contents with this::

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

This is a small bit of HTML markup, which does the following:

* Includes the common menu bar for the application (we customized it in the last section).
* Sets up some Bootstrap classes so that the page flows nicely.
* Inserts the default login form, via the `spLoginForm`_ directive.

Save that file and the browser should auto reload. If you click the Login link
you should now see the login route like this:

.. image:: _static/login_form.png

Perfect!  Now that we have a login form, we also need the ability to register
for an account.  Continue on to the next section and we will build a registration form.

If you want to further customize the look and behavior of the form,
please see the API documentation for the `spLoginForm`_ directive.
The most useful feature is the ability to specify your own template.


.. _spLoginForm: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spLoginForm:spLoginForm
.. _Stormpath Angular SDK: https://github.com/stormpath/stormpath-sdk-angularjs