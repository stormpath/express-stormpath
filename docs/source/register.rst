.. _register:

Create the Registration Form
===================


Generate the /register route
--------------------------------

When you want to create a new view in an Angular application, there
are a handful of files that you have to make.  Thankfully the generator
is going to help us with this.

Stop the server and run this command in your project folder::

    $ yo angular-fullstack:route register

It will ask you some questions, just hit enter to choose the defaults for all of them.  It is going to tell you that it has created these files for you::

    ? Where would you like to create this route? client/app/
    ? What will the url of your route be? /register
       create client/app/register/register.js
       create client/app/register/register.controller.js
       create client/app/register/register.controller.spec.js
       create client/app/register/register.css
       create client/app/register/register.html

Start the server and then manually type in the URL to ``/register``
in your browser, you will see the default view that was created:


.. image:: _static/default-register-view.png

Use the Registration Form Directive
--------------------------------

We're going to take advantage of the default registration form
that is available to you in the Stormpath Angular SDK

Open the file ``client/app/register/register.html`` and then replace
it's contents with this::

    <div ng-include="'components/navbar/navbar.html'"></div>

    <div class="container">
      <div class="row">
        <div class="col-xs-12">
          <h3>Registration</h3>
          <hr>
        </div>
      </div>
      <div sp-registration-form post-login-state="main"></div>
    </div>

This is a small bit of HTML markup which does the following:

* Includes the common menu bar for the application (we will customize it in a later section)
* Sets up some bootstrap classes so that the page flows nicely
* Inserts the default registration form, via the ``sp-registration-form`` directive
* Declares (on the directive) that we want to send the user to the main page after they register

Save that file and the browser should auto reload, you should now
see the registration route like this:

.. image:: _static/registration_form.png

If you want to further customize the look and behaviour of the form,
please see the API documentation of for
`sp-registration-frorm <https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spRegistrationForm:sp-registration-form>`_.
The most useful feature is the ability to specify your own template.

Try it, register for an account!
--------------------------------

That's it, really!  Give the form a try.  Once you register for an
account you will be automatically redirected back to the main page.
You will also be logged in automatically, and you will start seeing
the list of things again - remember how we locked it down?  Now that
you are authenticated you are allowed to access that part of the API
again