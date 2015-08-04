NOTE: As developing on this branch, you should be symlinked
to the "config parser" branch of the `stormpath` module

For immediate release:

* Implment registration fields features (map, and fieldOrder array)

* Session spec needs to be reviewed, and then implemented

* rework email verification feature to meet the framework spec

* ID site callback will need to contiue using a traditional session
  cookie, until we implement an oauth workflow that allows us to get
  an access token and refresh token after an ID site login.  So this
  library will need to be able to do authentiation with access tokens
  or the cookies that we create for ID site callbacks.

* implement "agular root path" setting, this tells the framework where
  the root of an HTML5-based angular app should be served from (any time
  we need to render a view, serve the root of this path if this path
  is defined)

* test all the features

* update all the documentation


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



