Primary feature goals:

[X] Login (password)
[X] Token verification (validate access tokens used as sessions)
[X] Logout (revoke tokens)
[X] Registration
[X] Email verification
[X] Password reset
[ ] Group authorization (including get groups and get group memberships from the SDK)
[ ] Social Login
[ ] Client credentials authentication w/ keys as app user credentials (Basic Auth)

Todo tasks (discovered while implemented Primary goals):

[ ] ensure that the migrated AS configuration will have the right settings for access token timeouts
[ ] caching of jwks (can use HTTP response from .well-known)
[ ] Remote token validation, in AccessTokenAuthenticator (right now it only does local validation)
[ ] Finish implementing the option to serialize custom data, rather than flatten it.
[ ] Ensure that cache regions are still working, and invalidation is working when resources are updated
[ ] Test refresh token logic in get-user.js to see if there are issues.