.. _authentication:

Authentication
==============


Browser Sessions
----------------

If you are building a web application that serves traditional HTML pages, or a
Single Page Application (Angular/React), this library will handle the cookie
sessions for you.  Behind the secnes we are issuing an OAuth Access Token and
Refresh Token to the browser.

If you want to ensure that as user is logged into your application, you should
use the ``loginRequired`` middleware.  It will force the user to login if
requird, or continue into your middleware::

    app.get('/secret', stormpath.loginRequired, function(req, res) {
      /*
        If we get here, the user is logged in.  Otherwise, they
        were redirected to the login page
       */
      res.send('Hello, ' + req.user.fullname);
    });

For browser-based clients, you can control the idle time and expiration time
of the session by modifying the OAuth Policy for the Stormpath Application
that you are using.

To change these settings, you should invoke a node client directly::

    var stormpath = require('stormpath'); // Using the Node SDK directly
    var client = new stormpath.Client();

    client.getApplication('your app href',function(err,application){
        application.getOAuthPolicy(function(err,policy){
            policy.accessTokenTtl = "PT1D"; // one day
            policy.save();
        });
    });

.. note::
    Express-Stormpath's session management will not interfere with any existing
    session middleware you might have.  The sessions that Stormpath uses are
    exclusively used for Stormpath purposes, so it's safe you create your own
    separate sessions.

    This works by utilizing the Express `router`_.


API Authentication: Basic Auth
------------------------------

For any account in your application, you can provision API Keys for those accounts.
Here is an example::

    app.post('/apiKeys', stormpath.loginRequired, function(req, res) {
      req.user.createApiKey(function(err,apiKey){
        if (err) {
          res.status(400).end('Oops!  There was an error: ' + err.userMessage);
        }else{
          res.json(apiKey);
        }
      });
    });

Your API clients can then use this key to authenticate against your API.  This
is how you would protect the secret endpoint with basic authentication::

    app.get('/secret', stormpath.apiAuthenticationRequired, function(req, res) {
      res.json({
        message: "Hello, " + req.user.fullname
      });
    });

In order for your API clients to authenticate with this endpoing, they need
to supply an HTTP Authorization header, like this::

    Authentication: Bearer <Base64UrlSafe(apiKeyId:apiKeySecret)>

You can use Curl to achieve the same request::

    $ curl -v --user apiKeyId:apiKeySecret http://localhost:3000/secret


API Authentication: Access Tokens
---------------------------------

In the previous example we showd you how to use HTP Basic Auth.  An alternative
scheme is the access token scheme, where we exhange our api keys for an access
token.  The benefit of this approach is that the access tokens are short lived
and we can refresh or revoke them, without having to use our api credentials
every time.

OAuth serves to provide additional security over basic authentication if you'd
like to give out more advanced / restricted access to your developers.

Typically, if you're building a REST API, and aren't sure which form of
authentication to offer -- it's a much better idea to simply use basic
authentication (*covered in the previous section*).

The way OAuth works is as follows:

- You've built a REST API that you want to secure.
- You've got developer accounts, and each developer account has an API key
  pair.
- A developer makes an HTTP POST request to your API service at the URL
  ``/oauth``, and authenticates via HTTP basic authentication.
- If the request to ``/oauth`` was successful, an OAuth token will be returned
  to the developer.  This token is a long string that expires in a given amount
  of time (*by default, OAuth tokens expire after one hour*).
- After the developer has this OAuth token, they can use this to authenticate
  future API requests instead of using their API key directly.


The flow by which we exchange the api keys for an access token is called the
`OAuth Client Credential Grant Flow`.  The specification says that we should
do this at the ``/oauth/token`` endpoint.  Our library handles this endpoint,
but you must enable it with the ``api`` option in your configuration::

    app.use(stormpath.init(app, {
      api: true
    }));

We can then use our api keys from the last example, to get an access token::

    $ curl -v --user apiKeyId:apiKeySecret http://localhost:3000/oauth?grant_type=client_credentials
    {"access_token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJEUExSSTVUTEVNMjFTQzNER0xHUjBJOFpYIiwiaXNzIjoiaHR0cHM6Ly9hcGkuc3Rvcm1wYXRoLmNvbS92MS9hcHBsaWNhdGlvbnMvNWpvQVVKdFZONHNkT3dUVVJEc0VDNSIsImlhdCI6MTQwNjY1OTkxMCwiZXhwIjoxNDA2NjYzNTEwLCJzY29wZSI6IiJ9.ypDMDMMCRCtDhWPMMc9l_Q-O-rj5LATalHYa3droYkY","token_type":"bearer","expires_in":3600}

The response is a JSON object which contains:

- ``access_token`` - Your OAuth access token.  This can be used to authenticate
  via subsequent requests.
- ``token_type`` - This will always be ``'bearer'``.
- ``expires_in`` - This is the amount of seconds (*as an integer*) for which
  this token is valid.

With that token, we can make a request of our secret endpoint and supply the
token as the bearer header in the request::

    $ curl -v -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJEUExSSTVUTEVNMjFTQzNER0xHUjBJOFpYIiwiaXNzIjoiaHR0cHM6Ly9hcGkuc3Rvcm1wYXRoLmNvbS92MS9hcHBsaWNhdGlvbnMvNWpvQVVKdFZONHNkT3dUVVJEc0VDNSIsImlhdCI6MTQwNjY1OTkxMCwiZXhwIjoxNDA2NjYzNTEwLCJzY29wZSI6IiJ9.ypDMDMMCRCtDhWPMMc9l_Q-O-rj5LATalHYa3droYkY" http://localhost:3000/secret
    {"message":"Hello, Robert"}


Configuring OAuth Token Settings
--------------------------------

You can control the expiration time of the tokens that are created for the
client credentials workflow.

Here is an example::

    app.use(stormpath.init(app, {
      "web": {
        "oauth2":{
          "client_credentials": {
            "accessToken": {
              "ttl": 3600
            }
          },
        }
      }
    }));
