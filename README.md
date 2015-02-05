# Stormpath Angular.js SDK [BETA]

[![NPM Version](https://img.shields.io/npm/v/stormpath-sdk-angular.svg?style=flat)](https://npmjs.org/package/stormpath-sdk-angular)
[![NPM Downloads](http://img.shields.io/npm/dm/stormpath-sdk-angular.svg?style=flat)](https://npmjs.org/package/stormpath-sdk-angular)
[![Build Status](https://img.shields.io/travis/stormpath/stormpath-sdk-angular.svg?style=flat)](https://travis-ci.org/stormpath/stormpath-sdk-angular)

*A simple user authentication library for Angular.js.*

[Stormpath](https://stormpath.com) is a User Management API that reduces
development time with instant-on, scalable user infrastructure.  Stormpath's
intuitive API and expert support make it easy for developers to authenticate,
manage, and secure users and roles in any application.

This library provides services for [Angular.js] that will allow you to implement
token authentication strategies in your Angular application.  This allows you
to authenticate an account (via username and password) and receive an access token
that can be used for subsequent requests.

At the moment this library is focusing purely on authentication.  Authorization
(aka access control) is left in your control.  A common use case with Stormpath
is to use Groups as an access control feature.

If you have feedback about this library, please get in touch and share your
thoughts! support@stormpath.com

## Installation

If you are using Bower simply install it:

```bash
bower install --save stormpath-angular-sdk
```

If you want to manually load the minified script you can get it from the `build`
folder in this repo.

## Quickstart

Please see the example that is in the `example` folder.  This is a fully
functional frontend & backend that uses stormpath.  To run the server
you will need need to clone this repo to your computer.

You will need Grunt on your system, you can install it with this command:

```bash
npm install -g grunt-cli
```

Then you will need to install the dependencies for this repo:

```bash
npm install
```

Then run this command to start the server and view the application:

```
grunt serve
```

[Angular.js]: https://angularjs.org "Angular.js"