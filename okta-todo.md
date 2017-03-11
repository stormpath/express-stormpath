Primary feature goals:

[X] Get login working
[X] Get token verification working
[X] Get logout working
[ ] Get registration working
[ ] Social Login
[ ] Group authorization
[ ] Email verification
[ ] Password reset
[ ] Client credentials authentication w/ keys as app user credentials
[ ] Remove dependencies on Stormpath configuration
[ ] Try to get current tests working, or rely on TCK?

Todo tasks (discovered while implemented Primary goals):

[ ] ensure that the migrated AS configuration will have the right settings for access token timeouts
[ ] caching of jwks (can use HTTP response from .well-known)
[ ] Caching of user resources.  Note: need to invalidate this cache on logout (this has been removed and needs to be re-implemented)
[ ] Remote token validation, in AccessTokenAuthenticator (right now it only does local validation)
[ ] authenticationResult should preserved, as much as possible
[ ] Transform the okta user object to the existing Stormpath account object, so that req.user.foo references will not break
[ ] Invalid grant needs to be presented as "username or password"

# Configuration assumptions

- An okta application, so that users can have a profile that is specific to that application.

# Not addressed/discovered yet

- If you added custom scope using a Stormpath Scope Factory Strategy, those values aren't going to be preserved, "grantedScopes".
- Refresh token logic in get-user.js
- Expanding groups, and deciding if we should transform that shape into the current shape
