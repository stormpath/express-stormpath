.. _authentication:

Authentication
==============

When a user logs into your application, they are authenticating who they are.
Stormpath provides several strategies for authenticating users, including
simple passwords, social login, and organization-context authentication.

The common feature of all these flows is that an OAuth 2.0 access token and
refresh token pair is created for the user when they authenticate.  In this
section we will discuss the different ways that a user can authenticate, and how
you can use the granted tokens to authenticate requests to your server.

.. _setting_token_expiration_time:

For all cases, we rely on the OAuth Policy of your Stormpath Application when
deciding how long tokens should be good for.  If you need to change these values,
please see `Managing an Application’s OAuth Policy <https://docs.stormpath.com/console/product-guide/latest/applications.html#managing-an-application-s-oauth-policy>`_
in the Admin Console guide, or `Configuring Token Based Authentication <https://docs.stormpath.com/rest/product-guide/latest/auth_n.html#configuring-token-based-authentication>`_ in the REST Product Guide.


This section will discuss strategies that are applicable to any front-end or
mobile application.  While we recommend reading this section and understanding
the flows, Stormpath also provides client SDKs that wrap most of these behavior,
so that you don't have to build it yourself.

Please visit https://docs.stormpath.com for more information on these libraries.

Password Authentication
-----------------------

This is the most straightforward form of authentication that everyone is
familiar with.  Stormpath provides several ways for a user to provide their
username and password, in exchange for an access and refresh token.

In this sub-section, we will cover the different authentication endpoints that
Stormpath provides.

Client API
....................

The `Stormpath Client API`_ is designed for front-end and mobile clients,
it is a hosted API for your application that allows the user to post their
credentials and receive an access token.  This API is useful when you want Stormpath
to host the authentication API for you, so that your Express server is not
responsible for authentication.

When using the Client API, you will use the standard OAuth 2.0 Password Grant
to obtain an access and refresh token.  Once the tokens have been obtained,
you can use them to authenticate requests with your express server, and this is
covered in the next sub-section, Token Authentication.

Please see the `Stormpath Client API Product Guide`_ for complete information
on authenticating the user and obtaining tokens.


HTML Login Form
...............

If you have added the ``express-stormpath`` library to your server, we
automatically serve a login form at ``/login``.  This is a simple form that allows
the user to submit their username and password.

If the user authenticates successfully, we create an access token and refresh
token (same as all other flows), but in this case we will store those tokens
for you in Http-Only cookies that are tied to the local domain of your Express
server.  This is convenient because the browser will automatically supply those
tokens on subsequent requests, you will not have to do extra work to send those
tokens to your server.

.. _configuring_cookie_flags:

The feature is covered in detail in the :ref:`Login` section.  Depending on your
use-case, you may need to change some of the properties that we set on the cookies
that are automatically created by our ``/login`` endpoint, which can be done with
the following configuration:

.. code-block:: javascript

  app.use(stormpath.init({
    web: {
      accessTokenCookie: {
        domain: null,
        httpOnly: true,
        path: "/",
        secure: null
      },
      refreshTokenCookie: {
        // same as the accessTokenCookie
      }
    }
  }));

This table describes each setting in detail:

+-------------+---------+------------------------------------------------------+
| Cookie Flag | Default | Description                                          |
+=============+=========+======================================================+
| domain      | null    | Set if needed, e.g. "subdomain.mydomain.com".        |
+-------------+---------+------------------------------------------------------+
| httpOnly    | true    | True by default, do not disable without good reason  |
|             |         | (exposes tokens to XSS | attacks).                   |
+-------------+---------+------------------------------------------------------+
| path        | "/"     | Set if needed, e.g. "/newapp".                       |
+-------------+---------+------------------------------------------------------+
| secure      | null    | Will be ``true`` in HTTPS environments (as detected  |
|             |         | by ``req.protocol``), unless explicitly set to       |
|             |         | ``false`` (not recommended!).                        |
+-------------+---------+------------------------------------------------------+


JSON Login API
..............

Similar to the HTML Login Form approach, you can post the same data to the
``/login`` endpoint, but as JSON data instead of a form POST.  The result is the
same: an access and refresh token is created, and automatically stored for you
in cookies.

The feature is covered in detail in the :ref:`Login` section.


Local OAuth2 API
................

As mentioned earlier, you can use the `Stormpath Client API`_ directly from your
SPA or mobile client to authenticate the user and obtain access tokens, using
the password grant flow.

However, some developers need this OAuth2 API to exist on their server, likely
because they want it to be on the same domain as the rest of their application.
If you have added the ``express-stormpath`` library to your server, we
automatically serve the OAuth 2.0 API at ``/oauth/token``.  This is the same API
that you can use from the `Stormpath Client API`_, but in this case it is simply
served by your Express server.  The result is the same: your client will receive
tokens after a successful password authentication.

Just like the `Stormpath Client API`_, the format of an authentication request should look like this:

.. code-block:: text

  POST http://localhost:3000/oauth/token HTTP/1.1
  Content-Type: application/x-www-form-urlencoded

  grant_type=password&username=user@gmail.com&password=theirPassword

The response will be a standard OAuth 2.0 response, providing your client with
the necessary tokens:

.. code-block:: javascript

  {
    "refresh_token": "eyJraWQiOiI2...",
    "stormpath_access_token_href": "https://api.stormpath.com/v1/accessTokens/3bBAHmSuTJ64DM574awVen",
    "token_type": "Bearer",
    "access_token": "eyJraWQiOiI2Nl...",
    "expires_in": 3600
  }


Token Authentication
--------------------

So far we have discussed the various ways in which a user (and their client, e.g.
your single-page app or mobile app) can obtain an access and refresh token.
Once the client has tokens, they can use them to authenticate HTTP requests to
your server.  In this section we will show you the various ways this is possible.

Authorization Header
....................

In this scenario, the client adds the ``Authorization`` header to the HTTP
request, and supplies the access token as the value of the header, using the
``Bearer <access_token>`` scheme.  This scenario is typically used in the following
situations:

- Mobile applications, which prefer the ``Authorization`` approach over a cookie solution.  They typically do not have cookie store implementations.
- Single Page Apps (SPAs), when the authentication API is not on the same domain as the API that requires authentication. This is true when using the `Stormpath Client API`_ as your authentication domain.

An example header would look like this:

.. code-block:: text

  Authorization: Bearer eyJraWQiOiI2NldURFJVM1paSkNZVFJVVlZTUUw3WEJOIiwic3R0IjoiYWNjZXNzIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiIzV0llS3N1SmR6YWR5YzN4U1ltc1l6IiwiaWF0IjoxNDY5ODMzNzQ3LCJpc3MiOiJodHRwczovL2FwaS5zdG9ybXBhdGguY29tL3YxL2FwcGxpY2F0aW9ucy8yNGs3SG5ET3o0dFE5QVJzQnRQVU42Iiwic3ViIjoiaHR0cHM6Ly9hcGkuc3Rvcm1wYXRoLmNvbS92MS9hY2NvdW50cy8yRWRHb3htbGpuODBlRHZjM0JzS05EIiwiZXhwIjoxNDY5ODM0MzQ3LCJydGkiOiIzV0llS3BhRWpQSGZMbXk2R0l2Ynd2In0.9J7HvhgJZxvxuE-0PiarTDTFPCVVLR_nvRByULNA01Q


Cookies
.......

While the ``Authorization`` header approach is becoming more common, cookies
still offer some advantages and Stormpath supports cookies as a means for sending
the access token to your server.  Cookies are useful for these scenarios:

- Enhanced security for browser clients: HTTP-Only, Secure cookies (with a CSRF mitigation solution) can be more secure than using Local Storage, as the Local Storage API is vulnerable to XSS attacks.
- Clients can be simpler, as they don't need to manually supply the token on every request (the browser does this for you).

Stormpath provides an additional feature for cookie authentication: we will
transparently refresh the access token for you, so that you client does not need
to do this.

If you would like to authenticate requests with cookies, the access token and
refresh token should be supplied with as the ``access_token`` and ``refresh_token``
values when creating the ``Cookie`` header of the request. For example:

.. code-block:: text

  Cookie: access_token=eyJraWQiOiIyMzhCSFRDQTlXUzhEMTJOUkdMMU5OMVNGIiwic3R0IjoiYWNjZXNzIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiI1Q1ExQldvdW5YS2NCZmpMMFltMXUwIiwiaWF0IjoxNDg1Mjk5NTg4LCJpc3MiOiJodHRwczovL2FwaS5zdG9ybXBhdGguY29tL3YxL2FwcGxpY2F0aW9ucy8yNGs3SG5ET3o0dFE5QVJzQnRQVU42Iiwic3ViIjoiaHR0cHM6Ly9hcGkuc3Rvcm1wYXRoLmNvbS92MS9hY2NvdW50cy81dThCWVp0dTA5czN5ZDFYdERZUlNvIiwiZXhwIjoxNDg2MTYzNTg4LCJydGkiOiI1Q1ExQlRVcHN4MWRZcWRUb0l1bEh3In0.epnM3D-pMMoHYdYziQJt-m1Nibmdbr_qPuJOSrfoqAw; refresh_token=eyJraWQiOiIyMzhCSFRDQTlXUzhEMTJOUkdMMU5OMVNGIiwic3R0IjoicmVmcmVzaCIsImFsZyI6IkhTMjU2In0.eyJqdGkiOiI1Q1ExQlRVcHN4MWRZcWRUb0l1bEh3IiwiaWF0IjoxNDg1Mjk5NTg4LCJpc3MiOiJodHRwczovL2FwaS5zdG9ybXBhdGguY29tL3YxL2FwcGxpY2F0aW9ucy8yNGs3SG5ET3o0dFE5QVJzQnRQVU42Iiwic3ViIjoiaHR0cHM6Ly9hcGkuc3Rvcm1wYXRoLmNvbS92MS9hY2NvdW50cy81dThCWVp0dTA5czN5ZDFYdERZUlNvIiwiZXhwIjoxNDg3MDI3NTg4fQ.4BE4LtR7zakTfkWeA86TM1fsEM8bhv2SFYcVCkBNy3Y



Requiring Authentication
.........................


You can protect APIs on your server by requiring authentication, using the
``authenticationRequired`` middleware.  This middleware will look for an access token
in the ``Authorization`` or ``Cookie`` header of the request.  If an access token
is found, it will assert that the access token is not expired and that is was
issued by the Stormpath Application that was specified by your configuration
when initializing ``express-stormpath``.

Here is an example of requiring authentication for a particular endpoint:

.. code-block:: javascript

  app.get('/secret', stormpath.authenticationRequired, function (req, res) {
    res.json({
      message: "Hello, " + req.user.fullname
    });
  });

If the request failed authentication, the user will be redirected to the login page, or given an error response (depending on the ``Accept`` header of the request).


Refreshing Tokens
.................

When the access token has expired, the client can use the refresh token to
obtain a new token.  If you are using one of our front-end or mobile SDKs, this
is done for you automatically.  If you need to manually get a new access token,
you make a ``refresh_token`` grant type POST to the ``/oauth/token`` endpoint of
your server, or the `Stormpath Client API`_. The client request looks like this:

.. code-block:: text

  POST http://localhost:3000/oauth/token HTTP/1.1
  Content-Type: application/x-www-form-urlencoded

  grant_type=refresh_token&refresh_token=eyJraWQiOiIyMzhCSFRDQTlXUzhEMTJOUkdMMU5OMVNGIiwic3R0IjoicmVmcmVzaCIsImFsZyI6IkhTMjU2In0.eyJqdGkiOiI1Q1ExQlRVcHN4MWRZcWRUb0l1bEh3IiwiaWF0IjoxNDg1Mjk5NTg4LCJpc3MiOiJodHRwczovL2FwaS5zdG9ybXBhdGguY29tL3YxL2FwcGxpY2F0aW9ucy8yNGs3SG5ET3o0dFE5QVJzQnRQVU42Iiwic3ViIjoiaHR0cHM6Ly9hcGkuc3Rvcm1wYXRoLmNvbS92MS9hY2NvdW50cy81dThCWVp0dTA5czN5ZDFYdERZUlNvIiwiZXhwIjoxNDg3MDI3NTg4fQ.4BE4LtR7zakTfkWeA86TM1fsEM8bhv2SFYcVCkBNy3Y

The response will contain a new access token.  Once the refresh token expires,
the user will have to re-authenticate with a username and password to get a new token pair.

For full documentation on our OAuth2 Access Token features, please see
`How Token-Based Authentication Works`_

.. _token_validation_strategy:


Validation Strategy
...................

When a request comes into your server, this library will use the access token,
provided by the client, to make an authentication decision.  The default
validation strategy (``local``) works like this:

- If the Access Token was issued by your Stormpath Application, and the token is not expired, the request is accepted.

- If the Access Token is expired, attempt to get a new one from the Stormpath
  REST API by using the Refresh Token (if the refresh token was presented as a cookie).

- If a new Access Token cannot be obtained, deny the request.

With the ``local`` option, our library only checks the signature and expiration of
the Access Token.  It does not check with the Stormpath REST API to assert that
the Access Token hasn't been revoked.

If you would like to check for Access Token revocation on every request, you
should opt-in to the ``stormpath`` validation strategy.  This will make a
network call to the Stormpath REST API.  If the Access Token has been revoked,
or the account has been disabled or deleted, the request will be rejected.

Opt-in to ``stormpath`` validation with this configuration:

.. code-block:: javascript

  {
    web: {
      oauth2: {
        password: {
          validationStrategy: 'stormpath'
        }
      }
    }
  }

.. warning::

  When using local validation, your server will not be aware of token revocation
  or any changes to the associated Stormpath account.  **This is a security
  trade-off that optimizes for performance.**  If you prefer extra security, use
  the ``stormpath`` validation option.

  If you prefer local validation, for the performance reasons, you can add more
  security by doing one of the following:

  * Use a short expiration time for your Access Tokens (such as five minutes or
    less).  This will limit the amount of time that the Access Token can be used
    for validation, while still reducing the number of times that we need to
    make a REST API call, with the refresh token, to get a new access token.

  * Maintain a blacklist of revoked Access Tokens, in your local application
    cache. Implement a middleware function that asserts that the Access Token is
    not in this cache, and reject the request if true.  We may implement this as
    a convenience feature in the future.


API Key Authentication
----------------------

If you are building an API service, you will need to distribute API keys to your
developers.  They will then use these keys to authenticate with your API, either
via HTTP Basic Auth or OAuth2 Access tokens.  We'll cover those strategies in
the next sections, but we need to provision API keys for your developers first.

Creating API Keys
.................

While your service may be an API service, you will still need to provide a
basic website that developers can use to obtain their keys.  Here is an example
of how you can create an API Key for the currently logged in user:

.. code-block:: javascript

  app.post('/apiKeys', stormpath.loginRequired, function (req, res) {
    req.user.createApiKey(function (err, apiKey) {
      if (err) {
        res.status(400).end('Oops!  There was an error: ' + err.userMessage);
      }else{
        res.json(apiKey);
      }
    });
  });

This is a naive example which simply prints out the API Keys for the user, but
once they have the keys they will be able to authenticate with your API.  For
more information on API Keys, please see `Using Stormpath for API Authentication`_

The next sections will show you how a developer can use those keys to authenticate
with your API.

HTTP Basic Authentication
.........................


This strategy makes sense if you are building a simple API service that does
not have complex needs around authorization and resource control.  This strategy
is simple because the developer simply supplies their API keys on every request
to your server.

Once the developer has their API keys, they will use them to authenticate with your
API.  For each request they will set the ``Authorization`` header, like this::

    Authorization: Basic <Base64UrlSafe(apiKeyId:apiKeySecret)>

How this is done will depend on what tool or library they are using.  For example,
if using curl:

.. code-block:: sh

  curl -v --user apiKeyId:apiKeySecret http://localhost:3000/secret

Or if you're using the ``request`` library:

.. code-block:: javascript

  var request = require('request');

  request({
    url: 'http://localhost:3000/secret',
    auth: {
      user: 'apiKeyId',
      pass: 'apiKeySecret'
    }
  }, function (err, res){
    console.log(res.body);
  });

You will need to tell your application that you want to secure this endpoint and
allow basic authentication.  This is done with the ``apiAuthenticationRequired``
middleware:

.. code-block:: javascript

  app.get('/secret', stormpath.apiAuthenticationRequired, function (req, res) {
    res.json({
      message: "Hello, " + req.user.fullname
    });
  });


OAuth2 Client Credentials
.........................

If you are building an API service and you have complex needs around
authorization and security, this strategy should be used.  In this situation
the developer does a one-time exchange of their API Keys for an Access Token.
This Access Token is time limited and must be periodically refreshed.  This adds a
layer of security, at the cost of being less simple than HTTP Basic
Authentication.

If you're not sure which strategy to use, it's best to start with HTTP Basic
Authentication. You can always switch to OAuth2 at a later time.

Once a developer has an API Key pair (see above, *Issuing API Keys*), they will
need to use the OAuth2 Token Endpoint to obtain an Access Token.  In simple
HTTP terms, that request looks like this:

.. code-block:: text

  POST /oauth/token HTTP/1.1
  Host: myapi.com
  Content-Type: application/x-www-form-urlencoded
  Authorization: Basic <Base64UrlSafe(apiKeyId:apiKeySecret)>

  grant_type=client_credentials

How you construct this request will depend on your library or tool, but the key
parts you need to know are:

  * The request must be a POST request.
  * The content type must be form encoded, and the body must contain
    ``grant_type=client_credentials``.
  * The Authorization header must be Basic and contain the Base64 Url-Encoded
    values of the Api Key Pair.

If you were doing this request with curl, it would look like this:

.. code-block:: sh

  curl -X POST --user api_key_id:api_key_secret http://localhost:3000/oauth/token -d grant_type=client_credentials

Or if using the ``request`` library:

.. code-block:: javascript

  request({
    url: 'http://localhost:3000/oauth/token',
    method: 'POST',
    auth: {
      user: '1BWQHHJCOW90HI7HFQ5LTD6O0',
      pass: 'zzeu+NwmicjtJ9yDJ2KlRguC+8uTjKVm3AMs80ah6hw'
    },
    form: {
      'grant_type': 'client_credentials'
    }
  },function (err,res) {
    console.log(res.body);
  });

If the credentials are valid, you will get an Access Token response that looks
like this::

    {
      "access_token": "eyJ0eXAiOiJKV1QiL...",
      "token_type": "bearer",
      "expires_in": 3600
    }

The response is a JSON object which contains:

- ``access_token`` - Your OAuth Access Token.  This can be used to authenticate
  on future requests.
- ``token_type`` - This will always be ``"bearer"``.
- ``expires_in`` - This is the amount of seconds (*as an integer*) for which
  this token is valid.

With this token you can now make requests to your API.  This request is simpler,
as only thing you need to supply is ``Authorization`` header with the Access
Token as a bearer token.  If you are using curl, that request looks like this:

.. code-block:: sh

  curl -v -H "Authorization: Bearer eyJ0eXAiOiJKV1QiL..." http://localhost:3000/secret

Or if using the ``request`` library:

.. code-block:: javascript

  request({
    url: 'http://localhost:3000/secret',
    auth: {
      'bearer': 'eyJ0eXAiOiJKV1QiL...'
    }
  }, function (err, res){
    console.log(res.body);
  });

In order to protect your API endpoint and allow this form of authentication,
you need to use the ``apiAuthenticationRequired`` middleware:

.. code-block:: javascript

    app.get('/secret', stormpath.apiAuthenticationRequired, function (req, res) {
      res.json({
        message: "Hello, " + req.user.fullname
      });
    });

By default the Access Tokens are valid for one hour.  If you want to change
the expiration of these tokens you will need to configure it in the server
configuration, like this:

.. code-block:: javascript

  app.use(stormpath.init(app, {
    web: {
      oauth2: {
        client_credentials: {
          accessToken: {
            ttl: 3600 // your custom TTL, in seconds, goes here
          }
        }
      }
    }
  }));



.. _Stormpath Client API: https://docs.stormpath.com/client-api/product-guide/latest/
.. _Stormpath Client API Product Guide: https://docs.stormpath.com/client-api/product-guide/latest/
.. _Using Stormpath for API Authentication: https://docs.stormpath.com/guides/api-key-management/
.. _How Token-Based Authentication Works: http://docs.stormpath.com/guides/token-management/
.. _router: http://expressjs.com/api.html#router
