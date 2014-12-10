.. _changelog:


Change Log
==========

All library changes, in descending order.


Version 0.5.9
-------------

**Released on December 10, 2014.**

- Making API key files get automatically detected if not specified in the user's
  middleware configuration.  By default we'll look for an ``apiKey.properties``
  file in the current directory, and as a backup, we'll check for
  ``~/.stormpath/apiKey.properties`` (*platform independent*).
- Making ``secretKey`` configuration optional.  If no ``secretKey`` is specified
  when the Stormpath middleware is initialized, we'll create on automatically.
  This makes it easy to do test apps without hard coding a secret key value.
  This is a very bad idea for production apps, though.
- Making ``application`` an optional field -- if no application href is
  specified, and the user has a single application created on Stormpath, we'll
  go ahead and use that application by default. This makes configuration even
  simpler as *no fields* are required by default.
- Making ``application`` get auto-loaded for Heroku apps =)
- Updating docs to show simpler ``req.user`` usage for account access.


Version 0.5.8
-------------

**Released on December 8, 2014.**

- Adding support for Google's hd attribute.


Version 0.5.7
-------------

**Released on December 8, 2014.**

- Fixing version release info.


Version 0.5.6
-------------

**Released on December 8, 2014.**

- Upgrading our use of ``res.json`` for the latest version of Express.
- Upgrading the Stormpath library dependency.
- Fixing an issue with the login route's auto login functionality. It will now
  work as expected.


Version 0.5.5
-------------

**Released on November 20, 2014.**

- Refactoring the way we insert ``app`` into locals.  This fixes a bug where the
  unauthorized page wouldn't work in certain situations.


Version 0.5.4
-------------

**Released on November 18, 2014.**

- Adding the ability to automatically log a user in after a password reset has
  been performed.  This new setting is called
  ``enableForgotPasswordChangeAutoLogin``.
- Upgrading Node dependencies to latest releases.


Version 0.5.3
-------------

**Released on November 12, 2014.**

- Not displaying required field errors for users who are forcibly redirected to
  the login page.


Version 0.5.2
-------------

**Released on November 3, 2014.**

- Reducing session size by changing what data is stored in cookies.  We now
  *only* store an account's href in order to reduce the payload size.
- Various style fixes.
- Making minor upgrades to internal API to be express 4.x compatible.
- Fixing our OAuth get token endpoint (``/oauth``) -- this was broken due to
  router upgrade issues.


Version 0.5.1
-------------

**Released on October 29, 2014.**

- Adding better error handling for controllers -- some of the old controllers
  would simply display an empty 400 or 500 page when unexpected things happen --
  this is no longer the case.  We'll now display user friendly error pages.
- Adding the ability to specify cookie domains -- this allows developers to make
  the session cookie work across all subdomains.


Version 0.5.0
-------------

**Released on October 29, 2014.**

- Adding redirects after confirmation of submitted forms.  This prevents 'form
  submission' browser errors if a user refreshes their confirmation page.
- Adding docs explaining how to create custom views.


Version 0.4.9
-------------

**Released on October 27, 2014.**

- Adding the ability to pass in extra template context into all Stormpath
  templates (*courtesy of @lemieux*).
- Including docs on new template context stuff!
- Adding contributor docs.


Version 0.4.8
-------------

**Released on October 23, 2014.**

- Fixing bug in `accountVerificationEmailSentView` settings!  Thanks @lemieux!


Version 0.4.7
-------------

**Released on October 20, 2014.**

- Making our unauthorized flow a lot better.


Version 0.4.6
-------------

**Released on October 20, 2014.**

- Fixing issue where the stormpath middleware would run twice when a route was
  loaded.
- Fixing issue where the password reset page would display a generic error
  message even though no error had been generated.
- Slightly improving Google login documentation.  Including information on
  required fields.

Version 0.4.5
-------------

**Released on September 22, 2014.**

- Adding better error messages for forms.


Version 0.4.4
-------------

**Released on September 19, 2014.**

- Fixing critical bug with middleware requests -- any requests made WITHOUT
  expansion were failing for asserted permissions.


Version 0.4.3
-------------

**Released on September 18, 2014.**

- Adding auto-expansion options for accounts.  This allows you to expand
  account fields like ``customData``, ``groups``, etc. -- automatically!
- Upgrading dependencies.


Version 0.4.2
-------------

**Released on September 11, 2014.**

- Hotfix release -- contains patch to node-client-sessions library to fix an API
  issue.


Version 0.4.1
-------------

**Released on September 11, 2014.**

- Hotfix release: fixing critical bug in client-sessions dependency.  Linking to
  specific Git commit hash as a temporary workaround until mozilla cuts a
  release.


Version 0.4.0
-------------

**Released on September 11, 2014.**

- Adding support for ``postLogoutRedirectUrl``.  This setting allows a user to
  specify the URL which users are directed to after logging out.  It defaults to
  ``/``.
- Adding support for swappable session middlewares -- users can now use their
  *own* session middleware by setting the ``stormpathSessionMiddleware``
  variable when initializing their Stormpath middleware.  This allows for more
  flexible behavior if a user wants to store their session state on the
  server-side.
- Adding docs for the new session middleware config.
- Upgrading the Stormpath dependency.


Version 0.3.4
-------------

**Released on September 10, 2014.**

- Making ``postRegistrationHandler`` work with social login as well.


Version 0.3.3
-------------

**Released on September 8, 2014.**

- Fixing a subtle bug with user sessions and the account verification workflow.
  When a user verified their email address, the first request wouldn't contain
  the user's session data.
- Making the ``postRegistrationHandler`` work with the account verification
  workflow.


Version 0.3.2
-------------

**Released on September 5, 2014.**

- Making behavior for unauthorized users a bit nicer. Instead of logging a user
  out unexpectedly, we instead redirect them to the login page with the
  ``?next`` querystring set.


Version 0.3.1
-------------

**Released on September 5, 2014.**

- Changing the priority of authentication in ``helpers.getUser`` -- this fixes
  odd browser behavior when using frontend tools like Angular, which may set an
  HTTP Authorization header.


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
