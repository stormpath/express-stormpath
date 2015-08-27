NOTE: As developing on this branch, you should be symlinked
to the "config parser" branch of the `stormpath` module

For immediate release:

- convenience methods
- write tests for apiauthentication stuff in express
- write tests for enabling password reset
- write tests for enabling registration
- write tests for angular serving spa route stuffs
- test what happens if an app has no account stores? error
- implemet password grant flow at /oauth/token, document it
- revoke the refresh tokens when a user logs out
- test the post login handler
- option to specify a view for 401 and 403 state

Post Launch:


Future goals:

* expose new middleware functions that want
  * auth middlewares:
    * accessTokenCookieRequired
    * apiAuthenticationRequired    <-- what is this?  should it be apiKeyAuthenticationRequired?
    * basicAuthenticationRequired
    * getUser
    * oauthAutheticationRequired
    * oauthBearerAutheticationRequired

  * oauth exchange middlewares (for getting access tokens):

    * authenticateApiKeyForToken
    * authenticateUsernamePasswordForToken   <-- this should use our new token endpoint


* update the language and styling of the password reset and email
  verification workflows.  The wording is not my favorite right now,
  and there are some styling bugs (things aren't aligned correctly)

* move oauthpolicy configuration to a new place in the config object
