# Stormpath AngularJS SDK [BETA]


[![Bower Version](https://img.shields.io/bower/v/stormpath-sdk-angularjs.svg?style=flat)](https://bower.io)
[![Build Status](https://img.shields.io/travis/stormpath/stormpath-sdk-angularjs.svg?style=flat)](https://travis-ci.org/stormpath/stormpath-sdk-angularjs)

*A simple user authentication library for AngularJS.*


This library provides services and directives for [AngularJS] that will allow
you to solve these common user management tasks in your AngularJS application:

* Register new users
* Login users
* Verify new accounts via email tokens
* Secure password reset via email tokens
* Conditionally render parts of your UI, based on login state
* Control access to application routes

Under the hood this library uses Oauth Access Tokens (JWTs) as the authentication
mechanism.  This library implements the best-practice approaches that we outline in
[Token Based Authentication for Single Page Apps (SPAs)](https://stormpath.com/blog/token-auth-spa/).

If you have feedback about this library, please get in touch and share your
thoughts! support@stormpath.com

[Stormpath](https://stormpath.com) is a User Management API that reduces
development time with instant-on, scalable user infrastructure.  Stormpath's
intuitive API and expert support make it easy for developers to authenticate,
manage, and secure users and roles in any application.

## Hot screenshots

Curious?  Here's some screenies that show you what's included:

<table>
  <tr>
    <td width="33%" align="center" valign="top">
      <p><strong>Registration Forms</strong></p>
      <img src="http://docs.stormpath.com/angularjs/guide/_images/registration_form.png">

    </td>
    <td width="33%" align="center" valign="top">
      <p><strong>Logins Forms</strong></p>
      <center><img src="http://docs.stormpath.com/angularjs/guide/_images/login_form.png"></center>

    </td>
    <td width="33%" align="center" valign="top">
      <p><strong>User Profile Information</strong></p>
      <center><img src="http://docs.stormpath.com/angularjs/guide/_images/profile_view.png"></center>

    </td>
  </tr>
</table>

## Installation

If you are using Bower simply install it:

```bash
bower install --save stormpath-sdk-angularjs
```

If you want to manually load the minified scripts you can grab them from the `dist`
folder in this repo and include them manually:

```html
<script src="stormpath-sdk-angularjs.min.js"></script>
<script src="stormpath-sdk-angularjs.tpls.min.js"></script>
```

You can then require the Stormpath modules in your application:

```javascript

var myApp = angular.module('myApp', ['stormpath','stormpath.templates']);

```

The templates are optional, see the documentation for more information.


## Documentation & Guide

If you are starting a new project the
[Stormpath AngularJS Guide](http://docs.stormpath.com/angularjs/guide/index.html)
will be your best choice.  It will help you get started with a new project and an API
server for your application.

If you already have an Angular project you will want to visit the
[Stormpath AngularJS SDK API Documenation](https://docs.stormpath.com/angularjs/sdk/).
That documentation will show you all the available directives and services that you
can use in your application.

## Example application

This repository contains a working example application in the `example/dashboard-app` folder.
This is the application that we build in the [Stormpath AngularJS Guide](http://docs.stormpath.com/angularjs/guide/index.html).
If you would like to skip the guide and start using the example applicion, do the following:

1) Clone this repo

2) In your terminal, change directories to the `example/dashboard-app` folder

3) Run `npm install && bower install`

4) Configure your Stormpath variables as explained in the
[Secure the API](https://docs.stormpath.com/angularjs/guide/protect_api.html)
section of the documenation

5) Run `grunt serve` to start the Guide

You will need Grunt on your system, you can install it with this command:

[AngularJS]: https://angularjs.org "AngularJS"
