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

The templates are optional, see the documentation for more information.


## Documentation & Guide

If you are starting a new project the
[Stormpath AngularJS Guide](http://docs.stormpath.com/angularjs/guide/index.html)
will be your best choice.  It will help you get started with a new project and an API
server for your application.

If you would like to dive into the API of this module you will want the
[Stormpath AngularJS SDK API Documenation](https://docs.stormpath.com/angularjs/sdk/).

Documentation is also available from the example application.
While running `grunt serve` the documenation will be automatically
updated if you edit the ngdoc directives in the source code.


## Example application

This repository contains a minimal example application in the `example` folder.
This is a fully functional frontend & backend that uses this module.  To run the server
you will need need to clone this repo to your computer.

You will need Grunt on your system, you can install it with this command:

```bash
npm install -g grunt-cli
```

After you clone this repo you run run this inside of it, this will install
the dependencies:

```bash
npm install
```

You should then edit the file `example/server.js` and replace the default
credentials with your Stormpath API Key and Secret and application href.

Then run this command to start the server and view the application:

```
grunt serve
```


[AngularJS]: https://angularjs.org "AngularJS"
