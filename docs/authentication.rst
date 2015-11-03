.. _authentication:

Authentication
==============

This library offers several options for securing your server and authenticating
your users.  Which strategy should you use?  The answer depends on your use
case, and we'll discuss each one in detail.  But at a high level, your choices
look like this:

  * If you are building a traditional web-app or single page application, you
    should use **Cookie Authentication**.

  * If you are building a mobile application, you should use the **OAuth2
    Password Grant**.

  * If you are building an API service, you can **HTTP Basic Authentication** or
    **OAuth2 Client Credentials**.



Cookie Authentication
---------------------

If you are building a web application that serves traditional HTML pages, or a
Single Page Application (Angular/React), this library will handle the cookie
sessions for you.  No special configuration is necessary.

To use cookie authentication, simply use the ``loginRequired`` middleware::

    app.get('/secret', stormpath.loginRequired, function (req, res) {
      /*
        If we get here, the user is logged in.  Otherwise, they
        were redirected to the login page
       */
      res.send('Hello, ' + req.user.fullname);
    });

Behind the scenes we are using OAuth2 Access Tokens, and storing them in the
cookies.  The lifetime of the cookies is controlled by the OAuth Policy of
your Stormpath Application.  By default the cookies will expire after 60 days.

If you need to change the expiration time of the cookies, please login to the
Stormpath Admin Console and find the OAuth policy inside of your Stormpath
Application.  Then change the expiration time of the Refresh Token.

.. note::
    Express-Stormpath's session management will not interfere with any existing
    session middleware you might have.  The sessions that Stormpath uses are
    exclusively used for Stormpath's purposes, so it's safe you create your own
    separate sessions.

    This works by utilizing the Express `router`_.


Issuing API Keys
----------------

If you are building an API service you will need distribute API keys to your
developers.  They will then use these keys to authenticate with your API, either
via HTTP Basic Auth or OAuth2 Access tokens.  We'll cover those strategies in
the next sections, but we need to provision API keys for your developers first.

While your service may be an API service, you will still need to provide a
basic website that developers can use to obtain their keys.  Here is an example
of how you can create an API Key for the currently logged in user::

    app.post('/apiKeys', stormpath.loginRequired, function (req, res) {
      req.user.createApiKey(function (err,apiKey){
        if (err) {
          res.status(400).end('Oops!  There was an error: ' + err.userMessage);
        }else{
          res.json(apiKey);
        }
      });
    });

This is a naive example which simply prints out the API Keys for them, but
once they have the keys they will be able to authenticate with your API.

For more information on API Keys, please see
`Using Stormpath for API Authentication`_

Enabling API Authentication
---------------------------

Regardless of the authentication strategy that you choose, you will need to
enable the API Authentication features by configuring your server with the
``api`` option::

    app.use(stormpath.init(app, {
      api: true
    }));


HTTP Basic Authentication
-------------------------

This strategy makes sense if you are building a simple API service that does
not have complex needs around authorization and resource control.  This strategy
is simple because the developer simply supplies their API keys on every request
to your server.

Once the developer has the API keys, they will use them to authenticate with your
API.  For each request they will set the ``Authorization`` header, like this::

    Authorization: Basic <Base64UrlSafe(apiKeyId:apiKeySecret)>

How this is done will depend on what tool or library they are using.  For example,
if using curl::

    $ curl -v --user apiKeyId:apiKeySecret http://localhost:3000/secret

You will need to tell your server that you want to secure your endpoints, and
allow basic authentication.  That is done with the ``apiAuthenticationRequired``
middleware::

    app.get('/secret', stormpath.apiAuthenticationRequired, function (req, res) {
      res.json({
        message: "Hello, " + req.user.fullname
      });
    });


OAuth2 Client Credentials
-------------------------

If you are building an API service and you have complex needs around
authorization and security, this strategy should be used.  In this situation
the developer does a one-time exchange of their API Keys for an access token.
This access token is time limited and must be periodically renewed.  This adds a
layer of security, but at the cost of being less simple than HTTP Basic
Authentication.

If you're not sure which flow to use, it's best to start with HTTP Basic
Authentication. You can always switch to  OAuth2 at a later time.

Once a developer has an API Key pair (see above, *Issuing API Keys*), they will
need to use the Oauth2 Token Endpoint to obtain an access token.  In simple
HTTP terms, that request looks like this::


    POST /oauth/token HTTP/1.1
    Host: myapi.com
    Content-Type: application/x-www-form-urlencoded
    Authorization: Basic <Base64UrlSafe(apiKeyId:apiKeySecret)>

    grant_type=client_credentials

How you construct this request will depend on your library or tool, but the keys
parts you need to know are:

  * The request must be a POST request
  * The content type must be form encoded, and the body must contain
    ``grant_type=client_credentials``
  * The Authorization header must be Basic and contain the Base64 Url-Encoded
    values of the Api Key Pair.

If you were doing this request with curl, it would look like this::

    curl -X POST --user api_key_id:api_key_secret http://localhost:3000/oauth/token -d grant_type=client_credentials

If the credentials are valid, you will get an access token response that looks
like this::

    {
      "access_token": "eyJ0eXAiOiJKV1QiL...",
      "token_type": "bearer",
      "expires_in": 3600
    }

The response is a JSON object which contains:

- ``access_token`` - Your OAuth access token.  This can be used to authenticate
  on future requests.
- ``token_type`` - This will always be ``"bearer"``.
- ``expires_in`` - This is the amount of seconds (*as an integer*) for which
  this token is valid.

With that token you can now make requests of your API.  This request is simpler,
the only thing you need to do is supply the token in the ``Authorization`` header
as a bearer token.  If you are using Curl, that request looks like this::

    $ curl -v -H "Authorization: Bearer eyJ0eXAiOiJKV1QiL..." http://localhost:3000/secret

In order to protect your API endpoint and allow this form of authenetication,
you need to use the ``apiAuthenticationRequired`` middleware::

    app.get('/secret', stormpath.apiAuthenticationRequired, function (req, res) {
      res.json({
        message: "Hello, " + req.user.fullname
      });
    });

By default the access tokens are valid for one hour.  If you want to change
the expiration of these tokens you will need to configure it in the server
configuration, like this::


    app.use(stormpath.init(app, {
      "api": true,
      "web": {
        "oauth2":{
          "client_credentials": {
            "accessToken": {
              "ttl": 3600 // your custom TTL, in seconds, goes here
            }
          },
        }
      }
    }));


OAuth2 Password Grant
---------------------

This is the authentication strategy that you will want to use for mobile clients.
In this situation the end-user supplies their username and password to your
mobile application.  The mobile application sends that username and password to
your server, which then verifies the password with Stormpath.

If the account is valid and the password is correct, Stormpath will generate
an access token for the user.  Your server gets this access token from Stormpath
and then sends it back to your mobile application.

The mobile application then stores the access token in a secure location, and
uses it for future requests to your API.  Every time the mobile application uses
this access token your server will verify that it's still valid, using Stormpath.

When a user wants to login to your mobile application, the mobile application
should make this request to your server::

    POST /oauth/token HTTP/1.1
    Host: myapi.com
    Content-Type: application/x-www-form-urlencoded

    grant_type=password
    &username=user@gmail.com
    &password=theirPassword

If the authentication is successful, the Stormpath API will return an access
token to your mobile application.  The response will look like this::

    {
      "refresh_token": "eyJraWQiOiI2...",
      "stormpath_access_token_href": "https://api.stormpath.com/v1/accessTokens/3bBAHmSuTJ64DM574awVen",
      "token_type": "Bearer",
      "access_token": "eyJraWQiOiI2Nl...",
      "expires_in": 3600
    }

Your mobile application should store the access token and refresh token.  By
default the access token is valid for 1 hour and the refresh token for 60 days.
When the access token expires you can get a new access token by using the
refresh token::

    POST /oauth/token HTTP/1.1
    Host: myapi.com
    Content-Type: application/x-www-form-urlencoded

    grant_type=refresh_token
    &refresh_token=eyJraWQiOiI2...

The response will contain a new access token.  Once the refresh token expires,
the user will have to re-authenticate with a username and password.

You can control the lifetime of the access token a refresh token by modifying
the OAuth Policy of your Stormpath Application.  This can be found by logging
into the Stormpath Admin Console and finding your Application.

For full documentation on our OAuth2 Access Token features, please see
`Using Stormpath for OAuth 2.0 and Access/Refresh Token Management`_

.. _Using Stormpath for API Authentication: https://docs.stormpath.com/guides/api-key-management/
.. _Using Stormpath for OAuth 2.0 and Access/Refresh Token Management: http://docs.stormpath.com/guides/token-management/
.. _router: http://expressjs.com/api.html#router
