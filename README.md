# Express-Stormpath

[![NPM Version](https://img.shields.io/npm/v/express-stormpath.svg?style=flat)](https://npmjs.org/package/express-stormpath)
[![NPM Downloads](http://img.shields.io/npm/dm/express-stormpath.svg?style=flat)](https://npmjs.org/package/express-stormpath)
[![Build Status](https://img.shields.io/travis/stormpath/express-stormpath.svg?style=flat)](https://travis-ci.org/stormpath/express-stormpath)
[![Coverage Status](https://coveralls.io/repos/stormpath/express-stormpath/badge.svg?branch=master)](https://coveralls.io/r/stormpath/express-stormpath?branch=master)

Express-Stormpath is an extension for [Express.js](http://expressjs.com/) that makes it incredibly simple to add user authentication to your application, such as login, signup, authorization, and social login.

*[Stormpath](https://stormpath.com/) is a User Management API that reduces development time with instant-on, scalable user infrastructure. Stormpath's intuitive API and expert support make it easy for developers to authenticate, manage and secure users and roles in any application.*

* [Getting Started](#getting-started)
* [Documentation](#documentation)
* [Example](#example)
* [Help](#help)
* [Links](#links)
* [License](#license)

## Getting Started

Follow these steps to add Stormpath user authentication to your Express.js app.

1. **Download Your Key File**

  [Download your key file](https://support.stormpath.com/hc/en-us/articles/203697276-Where-do-I-find-my-API-key-) from the Stormpath Console.

2. **Store Your Key As Environment Variables**

  Open your key file and grab the **API Key ID** and **API Key Secret**, then run these commands to save them as environment variables:

  ```bash
  $ export STORMPATH_CLIENT_APIKEY_ID=<YOUR-ID-HERE>
  $ export STORMPATH_CLIENT_APIKEY_SECRET=<YOUR-SECRET-HERE>
  ```

  *On Windows, use the `setx` command instead of `export`.*

3. **Get Your Stormpath App HREF**

  Login to the [Stormpath Console](https://api.stormpath.com/) and grab the *HREF* (called **REST URL** in the UI) of your *Application*. It should look something like this:

  `https://api.stormpath.com/v1/applications/q42unYAj6PDLxth9xKXdL`

4. **Store Your Stormpath App HREF In an Environment Variable**

  ```bash
  $ export STORMPATH_APPLICATION_HREF=<YOUR-STORMPATH-APP-HREF>
  ```

  *On Windows, use the `setx` command instead of `export`.*

5. **Install The SDK**

  ```bash
  $ npm install --save express-stormpath
  ```

6. **Include It In Your App**

  ```javascript
  var stormpath = require('express-stormpath');
  ```

7. **Initialize It**

  **If your app is an API:**

  Set `api` to `true` and point `web.spaRoot` to where your front-end app is located. This will serve your app and create default API routes for login, registration, etc.

  ```javascript
  app.use(stormpath.init(app, {
    api: true,
    web: {
      spaRoot: path.join(SPA_ROOT, 'index.html')
    }
  }));
  ```

  **If your app is a website:**

  Set `website` to `true`. This will setup default views for login, registration, etc.

  ```javascript
  app.use(stormpath.init(app, {
    website: true
  }));
  ```

  *[Read more about the initialization in the documentation →](https://docs.stormpath.com/nodejs/express/latest/configuration.html#initialize-express-stormpath)*

8. **Wait For The SDK**

  Wait for the SDK to get ready, then start the web server:

  ```javascript
  app.on('stormpath.ready', function() {
    app.listen(3000, function() {
      //...
    });
  });
  ```

9. **Protect Your Routes**

  Use `stormpath.loginRequired` as a middleware to protect your routes:

  ```javascript
  app.get('/secret', stormpath.loginRequired, function(req, res) {
    //...
  });
  ```

  If the user tries to access this route without being logged in, they will be redirected to the login page.

10. **Login**

  To access a protected route, the user must first login.

  **If your app is an API:**

  Log them in by posting their username and password as JSON to the `/login` endpoint:

  ```javascript
  {
    "username": "foo@bar.com",
    "password": "myPassword"
  }
  ```

  If the login attempt was successful, you will receive a 200 response and a session cookie will be set on the response. If an error occurred, we will send a 400 status with an error message in the body.

  **If your app is a website:**

  Log them in by sending them to `/login` and fill in the login form.

  *[Read more about login in the documentation →](https://docs.stormpath.com/nodejs/express/latest/login.html)*

11. **Register**

  To be able to login, your users first need an account.

  **If your app is an API:**

  Sign them up by posting their information as JSON to the `/register` endpoint:

  ```javascript
  {
    "email": "foo@bar.com",
    "password": "mySuper3ecretPAssw0rd"
  }
  ```

  If the user was created successfully, you will receive a 200 response and the body will contain the account that was created. If an error occurred, we will send a 400 status with an error message in the body.

  **If your app is a website:**

  Sign them up by sending them to `/register` and fill in the form.

  *[Read more about registration in the documentation →](https://docs.stormpath.com/nodejs/express/latest/registration.html)*

12. **That's It!**

  You just added user authentication to your app with Stormpath. See the [documentation](https://docs.stormpath.com/nodejs/express/) for further information on how Stormpath can be used with your Express.js app.

## Documentation

For a full documentation of this library, see the [documentation](https://docs.stormpath.com/nodejs/express/).

## Help

Contact us via email at support@stormpath.com or visit our [support center](https://support.stormpath.com).

## Example

For an example app, see the [Stormpath SPA Development Server](https://github.com/stormpath/stormpath-spa-dev-server).

## Links

Below are some resources you might find useful.

* [15-Minute Tutorial: A Simple Web App With Node.js, Express, Bootstrap & Stormpath](https://stormpath.com/blog/build-nodejs-express-stormpath-app/)
* [Stormpath Node.js SDK](https://github.com/stormpath/stormpath-sdk-node)

## License

Apache 2.0, see [LICENSE](LICENSE).
