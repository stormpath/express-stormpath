

var spMiddleware = stormpath();

app.use(spMiddleware.getUser)


app.get('/secretGroup',spMiddleware.groupsRequired(['secret-group']));


app.get('/api/*',spMiddleware.apiAuthReq,spMiddleware.groupsRequired())



/*
  auth middlewares:

  tokenCookieRequired
  apiAuthenticationRequired
  basicAuthenticationRequired
  oauthAutheticationRequired
  oauthBearerAutheticationRequired

  oauth exchange middlewares:

  authenticateApiKeyForToken
  authenticateUsernamePasswordForToken

 */