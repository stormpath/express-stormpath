#Stormpath is Joining Okta
We are incredibly excited to announce that [Stormpath is joining forces with Okta](https://stormpath.com/blog/stormpaths-new-path?utm_source=github&utm_medium=readme&utm-campaign=okta-announcement). Please visit [the Migration FAQs](https://stormpath.com/oktaplusstormpath?utm_source=github&utm_medium=readme&utm-campaign=okta-announcement) for a detailed look at what this means for Stormpath users.

We're available to answer all questions at [support@stormpath.com](mailto:support@stormpath.com).

# Express-Stormpath

[![NPM Version](https://img.shields.io/npm/v/express-stormpath.svg?style=flat)](https://npmjs.org/package/express-stormpath)
[![NPM Downloads](http://img.shields.io/npm/dm/express-stormpath.svg?style=flat)](https://npmjs.org/package/express-stormpath)
[![Build Status](https://img.shields.io/travis/stormpath/express-stormpath.svg?style=flat)](https://travis-ci.org/stormpath/express-stormpath)
[![Coverage Status](https://coveralls.io/repos/stormpath/express-stormpath/badge.svg?branch=master)](https://coveralls.io/r/stormpath/express-stormpath?branch=master)
[![Slack Status](https://talkstormpath.shipit.xyz/badge.svg)](https://talkstormpath.shipit.xyz)

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

  Downlaod your API Key file by logging in to [https://api.stormpath.com/login](api.stormpath.com/login) and clicking the “Create API Key” button under the “Developer Tools” section.

2. **Store Your Key As Environment Variables**

  Open your key file and grab the **API Key ID** and **API Key Secret**, then run these commands to save them as environment variables:

  ```bash
  $ export STORMPATH_CLIENT_APIKEY_ID=<YOUR-ID-HERE>
  $ export STORMPATH_CLIENT_APIKEY_SECRET=<YOUR-SECRET-HERE>
  ```

  *On Windows, use the `set` or `setx` command instead of `export`.*

3. **Get Your Stormpath App HREF**

  Login to the [Stormpath Console](https://api.stormpath.com/) and grab the *HREF* (called **REST URL** in the UI) of your *Application*. It should look something like this:

  `https://api.stormpath.com/v1/applications/q42unYAj6PDLxth9xKXdL`

4. **Store Your Stormpath App HREF In an Environment Variable**

  ```bash
  $ export STORMPATH_APPLICATION_HREF=<YOUR-STORMPATH-APP-HREF>
  ```

  *On Windows, use the `set` or `setx` command instead of `export`.*

5. **Install The SDK**

  ```bash
  $ npm install --save express-stormpath
  ```

6. **Include It In Your App**

  ```javascript
  var stormpath = require('express-stormpath');
  ```

7. **Initialize It**

  You need to initialize the middlware and use it with your application.  We have
  options for various use cases.

  **If your app is a traditional website:**

  Initialize the Stormpath module, and pass an empty set of options:

  ```javascript
  app.use(stormpath.init(app, { }));
  ```

  This will enable the default features, such as login and registration pages.

  **If your app is a single page application (Angular, React)**

  You will need to tell our library where the root file is.  For example, if
  your Angular app is in the `client/` folder in your project:

  ```javascript
  app.use(stormpath.init(app, {
    web: {
      spa: {
        enabled: true,
        view: path.join(__dirname, 'client', 'index.html')
      }
    }
  }));
  ```

  *[Read more about the initialization in the documentation →][]*

8. **Wait For The SDK**

  Wait for the SDK to get ready, then start the web server:

  ```javascript
  app.on('stormpath.ready', function () {
    app.listen(3000, function () {
      //...
    });
  });
  ```

9. **Protect Your Routes**

  For websites and Single-Page Apps, use `stormpath.authenticationRequired` as a
  middleware to protect your routes:

  ```javascript
  app.get('/secret', stormpath.authenticationRequired, function (req, res) {
    //...
  });
  ```

  For API services that use HTTP Basic Auth, use
  `stormpath.apiAuthenticationRequired`:

  ```javascript
  app.get('/secret', stormpath.apiAuthenticationRequired, function (req, res) {
    //...
  });
  ```

  If the user tries to access this route without being logged in, they will be redirected to the login page.

10. **Login**

  To access a protected route, the user must first login.

  **Traditional Websites:**

  You can login by visiting the `/login` URL and submitting the login form.

  **Single Page Apps:**

  Your front-end client should POST this data to the `/login` endpoint:

  ```javascript
  {
    "username": "foo@bar.com",
    "password": "myPassword"
  }
  ```

  *Note: make sure that your client is setting the `Accept: application/json`
  header on the request.*

  *Using AngularJS?  Try our [Stormpath Angular SDK][]*

  **API Services**

  If your app is an API service that uses our client_credentials workflow, your API consumers
  can obtain access tokens by making this POST to your server:

  ```
  POST /oauth/token
  Authorization: Basic <Base64Endoded(ACCOUNT_API_KEY_ID:ACCOUNT_API_KEY_SECRET)>;
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials
  ```

  *[Read more about login in the documentation →][]*

11. **Register**

  To be able to login, your users first need an account.

  **Traditional Websites:**

  Users can register by visiting the `/register` URL and submitting the
  registration form.

  **Single Page Applications:**

  Your front-end client should POST this data to the `/register` endpoint:

  ```javascript
  {
    "email": "foo@bar.com",
    "password": "mySuper3ecretPAssw0rd"
  }
  ```

  If the user was created successfully, you will receive a 200 response and the
  body will contain the account that was created. If an error occurred, we will
  send a 400 status with an error message in the body.

  *Note: make sure that your client is setting the `Accept: application/json`
  header on the request.*

  *Using AngularJS?  Try our [Stormpath Angular SDK][]*

  *[Read more about registration in the documentation →][]*

12. **That's It!**

  You just added user authentication to your app with Stormpath. See the [documentation][] for further information on how Stormpath can be used with your Express.js app.

## Documentation

For a full documentation of this library, see the [documentation][].

## Help

Contact us via email at support@stormpath.com or visit our [support center][].

## Example

For an example app, see the [Stormpath SPA Development Server](https://github.com/stormpath/stormpath-spa-dev-server).

## Links

Below are some resources you might find useful.

* [15-Minute Tutorial: A Simple Web App With Node.js, Express, Bootstrap & Stormpath](https://stormpath.com/blog/build-nodejs-express-stormpath-app/)
* [Stormpath Node.js SDK](https://github.com/stormpath/stormpath-sdk-node)

## License

Apache 2.0, see [LICENSE](LICENSE).

[documentation]: https://docs.stormpath.com/nodejs/express/
[Read more about login in the documentation →]: https://docs.stormpath.com/nodejs/express/latest/login.html
[Read more about registration in the documentation →]: https://docs.stormpath.com/nodejs/express/latest/registration.html
[Read more about the initialization in the documentation →]: https://docs.stormpath.com/nodejs/express/latest/configuration.html#initialize-express-stormpath
[Stormpath Angular SDK]: https://github.com/stormpath/stormpath-sdk-angularjs
[support center]: https://support.stormpath.com
