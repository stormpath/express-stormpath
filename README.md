# Stormpath AngularJS SDK

[![Bower Version](https://img.shields.io/bower/v/stormpath-sdk-angularjs.svg?style=flat)](https://bower.io)
[![Build Status](https://img.shields.io/travis/stormpath/stormpath-sdk-angularjs.svg?style=flat)](https://travis-ci.org/stormpath/stormpath-sdk-angularjs)

This module provides services and directives for AngularJS that will allow you to solve common user management tasks using [Stormpath](https://stormpath.com/), such as *login* and *signup*.

*Stormpath is a User Management API that reduces development time with instant-on, scalable user infrastructure. Stormpath's intuitive API and expert support make it easy for developers to authenticate, manage and secure users and roles in any application.*

* [Getting Started](#getting-started)
* [Documentation](#documentation)
* [Example](#example)
* [Help](#help)
* [Contributing](#contributing)
* [License](#license)

## Getting Started

Follow these steps to add Stormpath user authentication to your AngularJS app.

*Don't have an app? Use our [example app](example/dashboard-app/) as a boilerplate - it has Stormpath already integrated!*

1. **Install UI-Router**

  The Stormpath module is only compatible with the [UI-Router][], so ensure that your application is using it.

2. **Integrate Your Back-End**

  This module requires Stormpath on your back-end to work properly. At the moment we
  have a fully-featured integration for **Express.js**, [express-stormpath][].

  For **other frameworks**, please see the [Server Integration Guide][].

  For a **quick setup**, use our [Stormpath SPA Development Server][].

3. **Download and Include the SDK**

  Download these two files:

  * [stormpath-sdk-angularjs.min.js](https://raw.githubusercontent.com/stormpath/stormpath-sdk-angularjs/master/dist/stormpath-sdk-angularjs.min.js)
  * [stormpath-sdk-angularjs.tpls.min.js](https://raw.githubusercontent.com/stormpath/stormpath-sdk-angularjs/master/dist/stormpath-sdk-angularjs.tpls.min.js)

  Then include them in your *index.html* file:

  ```html
  <script src="stormpath-sdk-angularjs.min.js"></script>
  <script src="stormpath-sdk-angularjs.tpls.min.js"></script>
  ```

  Or install with bower: `$ bower install --save stormpath-sdk-angularjs`

4. **Add the Module to Your App's Dependencies**

  Add the `stormpath` module and templates to your app's dependencies in *app.js*:

  ```javascript
  var app = angular.module('myApp', [..., 'stormpath', 'stormpath.templates']);
  ```

5. **Configure the UI-Router**

  In your `run()` block in *app.js*, configure the login state and the default state after login:

  ```javascript
  app.run(function($stormpath){
    $stormpath.uiRouter({
      loginState: 'login',
      defaultPostLoginState: 'home'
    });
  });
  ```

  Set `loginState` to your login state. If you don't have one, create one.
  Set `defaultPostLoginState` to your default state after login.

6. **Protect Your States**

  On all states that you want to protect, add:

  ```javascript
  sp: {
    authenticate: true
  }
  ```

  For example:

  ```javascript
  $stateProvider.state('secret', {
    url: '/secret',
    views: {...},
    sp: {
      authenticate: true
    }
  });
  ```

7. **Add States for Login and Signup**

  Create states and views for your login and signup page. Use the [`sp-login-form`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spLoginForm:spLoginForm) and [`sp-registration-form`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spRegistrationForm:spRegistrationForm) directives to inject the forms into your templates. E.g.

  ```html
  <div sp-login-form></div>
  ```

8. **Add Login and Logout Links**

  Use the [`sp-logout`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spLogout:spLogout) directive to end the session:

  ```html
  <a ui-sref="main" sp-logout>Logout</a>
  ```

  For the login link, just point the user to your login state:

  ```html
  <a ui-sref="login">Login</a>
  ```

9. **Hide Elements When Logged In**

  Use the [`if-user`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUser:ifUser) directive:

  ```html
  <a ui-sref="main" sp-logout if-user>Logout</a>
  ```

10. **Hide Elements When Logged Out**

  Use the [`if-not-user`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifNotUser:ifNotUser) directive:

  ```html
  <a ui-sref="login" if-not-user>Login</a>
  ```

11. **That's It!**

  You just added user authentication to your app with Stormpath. See the [API Documentation][] for further information on how Stormpath can be used with your AngularJS app.

## Documentation

For all available directives and services, see the [API Documentation][].

If you are using Yeomon, please see our [Yeoman Guide][].  It will walk
you through the creation of an Angular application from scratch, using Yeoman.

## Example

See [example/dashboard-app/](example/dashboard-app/) for an example application.

## Help

Contact us via email at support@stormpath.com or visit our [support center](https://support.stormpath.com).

## Contributing

Found something you want to change? Please see the [Contribution Guide](CONTRIBUTING.md),
we love your input!

## License

Apache 2.0, see [LICENSE](LICENSE).

[API Documentation]: https://docs.stormpath.com/angularjs/sdk/
[Server Integration Guide]: https://docs.stormpath.com/angularjs/sdk/#/server
[express-stormpath]: https://github.com/stormpath/stormpath-express
[Stormpath SPA Development Server]: https://github.com/stormpath/stormpath-spa-dev-server
[UI-Router]: https://github.com/angular-ui/ui-router
[Yeoman Guide]: https://docs.stormpath.com/angularjs/guide
