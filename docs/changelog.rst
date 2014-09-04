.. _changelog:


Change Log
==========

All library changes, in descending order.


Version 0.3.0
-------------

**Released on September 4, 2014.**

- Adding in a simpler way to access users: ``req.user``.


Version 0.2.9
-------------

**Released on September 3, 2014.**

- Fixing style issue for default authentication pages in IE.
- Fixing the rendering issue with form errors -- they were previously not
  displayed in a human-readable way.
- Improving ``enableAutoLogin`` behavior: it now successfully redirects to the
  URL specified by the ``next`` querystring (*if it exists*).
- Fixing issue with session max duration.  Adding in workaround to get around
  the mozilla bug.


Version 0.2.8
-------------

**Released on August 29, 2014.**

- Adding a ``postRegistrationHandler``.  This new functionality allows users to
  perform actions after a user has registered.


Version 0.2.7
-------------

**Released on August 28, 2014.**

- Fixing bug with certain boolean options.  If you had specified a false value
  for an option that defaulted to true -- your false value would not have taken
  effect.


Version 0.2.6
-------------

**Released on August 27, 2014.**

- Upgrading all dependencies!


Version 0.2.5
-------------

**Released on August 27, 2014.**

- Adding a new optional feature: ``enableAutoLogin``.  If this feature is
  enabled, then if a logged-in user visits the login page, they'll be
  automatically redirected to your application's ``redirectUrl`` route.


Version 0.2.4
-------------

**Released on August 26, 2014.**

- Fixing a bug which masked errors when starting up!  Thanks @robertjd!


Version 0.2.3
-------------

**Released on August 11, 2014.**

- Fixing a bug in which on the registration page, if you incorrectly filled out
  the registration form, all previous field values would be wiped.


Version 0.2.2
-------------

**Released on August 4, 2014.**

- Adding support for Stormpath's new ID site functionality: you can now enable
  this feature and have Stormpath handle authentication 100%.


Version 0.2.1
-------------

**Released on August 1, 2014.**

- Adding support for social login via Google and Facebook.


Version 0.2.0
-------------

**Released on July 28, 2014.**

- Fixing bug with CSRF.  In previous releases, this library included CSRF
  protection on *every* page of a user's site -- even if they didn't want it.
  In this release, we're now *only* including CSRF on the page that this library
  generates.  This is less confusing for users.
- Adding in API key / Oauth authentication support.  You can now secure your
  REST API with Stormpath!


Version 0.1.9
-------------

**Released on July 24, 2014.**

- Upgrading the stormpath dependencies.  This fixes an issue with caching.  Now
  all subsequent requests should be really, ridiculously fast (< 1ms).


Version 0.1.8
-------------

**Released on July 24, 2014.**

- Adding account verification feature!  You can now easily enable account
  verification emails / confirmation for users.


Version 0.1.7
-------------

**Released on July 22, 2014.**

- Adding forgot password link to login page, if enabled.


Version 0.1.6
-------------

**Released on July 22, 2014.**

- Fixing dependency issue (*we need express as a dependency*).
- Adding in password reset functionality!


Version 0.1.5
-------------

**Released on July 22, 2014.**

- Adding cache support (*local memory, memcached, redis*).


Version 0.1.4
-------------

**Released on July 11, 2014.**

- Removing unnecessary dependency (express).
- Requiring newer release of the stormpath library (*for proper user agent
  support*).
- Adding custom user agent to help with debugging / reporting issues.


Version 0.1.3
-------------

**Released on July 10, 2014.**

- Fixing bug with routes.  We now properly redirect unauthenticated users to
  their original destination by using `req.originalUrl`.


Version 0.1.2
-------------

**Released on July 9, 2014.**

- Fixing bug with credentials (*checking for `stormpathApiKeyId` instead of
  `stormpathApiKeyID`*).


Version 0.1.0
-------------

**Released on July 3, 2014.**

- First release!
- Basic functionality.
- Basic docs.
- Lots to do!
