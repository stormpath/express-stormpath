* node sdk needs to read the default directory of the given application, and then enable or disable `config.veirfy` feature
* implement access tokens and refresh tokens for sessions
* rework email verification flow to meet spec (url names, etc) and to work with angular'
* implement "agular root path" setting, for serving a specificed angular app
* expose the new middleware functions that want
  * auth middlewares:
    * accessTokenCookieRequired
    * apiAuthenticationRequired
    * basicAuthenticationRequired
    * getUser
    * oauthAutheticationRequired
    * oauthBearerAutheticationRequired

  * oauth exchange middlewares (for getting access tokens):

    * authenticateApiKeyForToken
    * authenticateUsernamePasswordForToken


* tests for any new features we've added

* update all the documentation