.. _register:

Registration Form
===================


Create the /register UI route
--------------------------

There are a handful of files that you need when creating a new view and matching route in an Angular aplication.

We will use Yeoman to help us out.  Run this command in your project folder::

    $ yo angular-fullstack:route register

It will ask you some questions, just hit enter to choose the defaults for all of them.  It is going to tell you that it has created these files for you::

    ? Where would you like to create this route? client/app/
    ? What will the url of your route be? /register
       create client/app/register/register.js
       create client/app/register/register.controller.js
       create client/app/register/register.controller.spec.js
       create client/app/register/register.css
       create client/app/register/register.html

You can now reload the app (you may need to restart the grunt server) and
manually go to the ``/register`` route to see the default view that was created:


.. image:: _static/default-register-view.png

Create a Form (with Bootstrap)
-----------------------------

Great!  Let's create the form now, replace the contents of ``register.html`` with this::


    <div class="row">
      <div class="col-sm-offset-2">
        <h3>Registration</h3>
      </div>
    </div>
    <hr>
    <form class="form-horizontal">
      <div class="form-group">
        <label for="inputFirstName3" class="col-sm-2 control-label">First Name</label>
        <div class="col-sm-4">
          <input type="email" class="form-control" id="inputFirstName3" ng-model="formModel.firstName" placeholder="First Name">
        </div>
      </div>
      <div class="form-group">
        <label for="inputLastName3" class="col-sm-2 control-label">Last Name</label>
        <div class="col-sm-4">
          <input type="email" class="form-control" id="inputLastName3" ng-model="formModel.lastName" placeholder="Last Name">
        </div>
      </div>
      <div class="form-group">
        <label for="inputEmail3" class="col-sm-2 control-label">Email</label>
        <div class="col-sm-4">
          <input type="email" class="form-control" id="inputEmail3" ng-model="formModel.email" placeholder="Email">
        </div>
      </div>
      <div class="form-group">
        <label for="inputPassword3" class="col-sm-2 control-label">Password</label>
        <div class="col-sm-4">
          <input type="password" class="form-control" id="inputPassword3" ng-model="formModel.password" placeholder="Password">
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-2 col-sm-10">
          <button type="submit" class="btn btn-default">Register</button>
        </div>
      </div>
    </form>

This will give you the following view:

.. image:: _static/registration_form.png

Create the Controller
---------------------

We need to create a basic Angular Controller which will:

* Create a form model on the scope, allowing us to gather the data from the form
* Submit that data to the $user service
* Handle succes and error cases