.. _changelog:


Change Log
==========

All library changes, in descending order.


Version 2.0.9
-------------

**Not yet released.**

- Fixing bug with customData expansion.
- Removing unnecessary JS code from the Google Login form, courtesy of `David
  Gisser <https://github.com/dgisser>`_.


Version 2.0.8
-------------

**Released on September 29, 2015.**

- Refactoring code base, big time.  Style updated for consistency.  Code
  simplified.  Functions modularized.  Tests modularized.
- Making Travis CI tests run properly.
- Only running coveralls when build succeeds.
- Improving coverage reports on the CLI.


Version 2.0.7
-------------

**Released on September 24, 2015.**

- Fixing bug with missing dependency: ``request``.  Hotfix release.


Version 2.0.6
-------------

**Released on September 24, 2015.**

- Improving option validation.
- Adding human-readable errors that help people fix their configuration data in
  a simpler manner.
- Refactoring integration tests to work with stricter validation rules.
- Fixing a bug in the registration page, courtesy of `@suryod
  <https://github.com/suryod>`_.
- Adding support for Node 4.1.
- Adding tests for the registration controller.
- Refactoring the registration controller for styling.
- Fixing several registration bugs: customData not being included, field
  validation, etc.
- Various style fixes.
- Various controller refactoring.
- Fixing option validation upon startup.
- Adding support for LinkedIn login button.
- Adding LinkedIn social login documentation.


Version 2.0.5
-------------

**Released on September 23, 2015.**

- Fixing a bug with the config parser, it was not reading environment variables
  before running the validation step.


Version 2.0.4
-------------

**Released on September 8, 2015.**

- Cleaning up some code.
- Updating broken documentation.


Version 2.0.3
-------------

**Released on September 8, 2015.**

- Fixing bug in the ``groupsRequired`` authorization middleware -- it was using
  a deprecated option, which was causing the library to throw an error if a user
  was NOT a member of the required Groups.


Version 2.0.2
-------------

**Released on September 4, 2015.**

- Improving documentation, showcasing the ``app.on('stormpath.ready')`` to
  prevent users from starting a web server before Stormpath has been
  initialized.
- Improving test coverage.


Version 2.0.1
-------------

**Released on August 31, 2015.**

- Fixing packaging bug.  In the previous release we introduced a bug that
  required users to install a dependency manually.  This release fixes the bug,
  ensuring packaging installs are smooth =)
- Updating our `package.json` so it finally uses a valid SPX license.  This
  makes licensing simpler in NPM.
- Making our Travis CI tests more reliable by retrying failed tests.  This is
  nice because sometimes we fail due to eventual consistency issues on the API
  side.


Version 2.0.0
-------------

**Released on August 27, 2015**

Hello everyone!  If you're reading this, then I want to take a moment to explain
what is new in this major **2.0.0** release!

This is a brand new release which changes a LOT of the way this library works.
This is NOT backwards compatible with previous releases, so please be sure to
checkout the :ref:`upgrading` for more information on how to port your code
from **1.X.X**.

Next -- this release has several motivations:

Firstly, since writing the original version of this library, we've all learned a
lot about what problems users have, what things need to be simpler, and what
things people really want to *do* with their authentication libraries.

After talking with many, many developers, we realized that the initial approach
we took, while awesome, was not nearly awesome enough.

One of the main features of this release is the default library behavior: from
now on, when you initialize the Stormpath middleware, you'll no longer get a
bunch of routes created automatically.  Instead, you'll activate the ones you
want.  This makes your applications much more secure, and gives you a lot more
flexibility in terms of what you're building.

While our old library was previously not that well suited for building API
services -- it now is =)

Next up: browser authentication.  The way we handled browser authentication
previously was a bit simplistic.  What we did was we created typical session
cookies, using normal cookie middleware.  While there's nothing wrong with this
-- we've since moved to a new approach that utilizes sessions + JWTs (JSON Web
Tokens).  This new approach makes your applications faster, more secure, and
most importantly -- it makes building SPAs (Single Page Apps) much easier.

If you're using Angular, React, or any other front-end Javascript framework,
you'll now be able to seamlessly make your SPAs work with this library, yey!

On top of all this, we've refactored a LOT of the internal workings of this
library to be more efficient.  We've greatly improved our test coverage.  And
we've resolved tons of issues that were causing users problems.

This new release is faster, more secure, more flexible, and just overall:
better.

In the coming days and weeks we'll be resolving whatever bugs we find, and we
are dedicated to making this the absolute best authentication library that
Node.js has ever seen!

Thank you for reading.

-Randall


Version 1.0.6
-------------

**Released on August 10, 2015.**

- Fixing broken Google login redirection.


Version 1.0.5
-------------

**Released on May 1, 2015.**

- Adding note for Windows users regarding setting environment variables.
- Added option ``sessionActiveDuration``, which can be used to extend a
  session if a request is made within the active duration timeframe. This
  is passed to the ``client-sessions`` library and the default is 5 minutes.


Version 1.0.4
-------------

**Released on April 8, 2015.**

- Making several documentation fixes / updates.
- Upgrading the way our session storage works.  While previously, this library
  would write session data to ``req.session`` -- it now writes data to
  ``req.stormpathSession`` -- this makes session handling less confusing for
  developers, as they're free to create their own session backends for their
  application logic, most of which bind to ``req.session`` by default.  This
  prevents conflicts in user code.
- Fixing an issue with custom scopes support for Google login.  This now works
  properly (*previously this functionality was broken*).


Version 1.0.3
-------------

**Released on March 31, 2015.**

- Adding support for a new configuration option: ``enableConfirmPassword`` and
  ``requireConfirmPassword``.  These options will add an extra field to the
  registration page that makes a user enter their password twice to confirm they
  entered it properly.
- Improving redirect functionality in middlewares.  When the user is redirected
  back to where they are coming from, URI parameters will be preserved.


Version 1.0.2
-------------

**Released on March 30, 2015.**

- Adding support for a new configuration option: ``cacheClient``.  This allows
  users to build their OWN cache object, configure it how they like, and then
  pass that to our library to be used for caching.  This lets you build more
  complex caching rules / objects.


Version 1.0.1
-------------

**Released on March 18, 2015.**

- Adding in new ``postLoginHandler`` that lets you intercept login requests.
- Adding in docs for new ``postLoginHandler`` hook.


Version 1.0.0
-------------

**Released on March 18, 2015.**

- Changing the method signature of ``postRegistrationHandler``.  It now receives
  an additional argument: ``req``, which allows developers to modify / work with
  the request object as well.  This is a break change, hence the major release
  number.
- Removing legacy support for our older sessions.  Since this is a major release
  with breaking changes, we won't support backwards compatibility.


Version 0.6.9
-------------

**Released on March 9, 2015.**

- Adding stricter enforcement rules to ``stormpath.apiAuthenticationRequired``
  -- it'll now double-verify the user based on the HTTP Authorization header for
  more compliance.


Version 0.6.8
-------------

**Released on March 5, 2015.**

- Enforcing our Stormpath middleware authentication types.  For instance,
  ``stormpath.apiAuthenticationRequired`` middleware now **only** allows through
  users who have authenticated via the HTTP Authorization header.


Version 0.6.7
-------------

**Released on February 20, 2015.**

- Providing backwards compatibility for older library users stuck on old
  sessions.  What we'll do is just expire them immediately to prevent issues.


Version 0.6.6
-------------

**Released on February 20, 2015.**

- Adding a new feature: the ability for users to resend their account
  verification email from the login page.  This was suggested by `@lemieux
  <https://github.com/lemieux>`_.  Basically, the way it works is that if a user
  has the account verification stuff turned on (*a new user gets an email with a
  link they have to click to verify their account*), then we provide a built-in
  link on the login page so that users who didn't receive this email can request
  another one automatically.


Version 0.6.5
-------------

**Released on February 16, 2015.**

- Modifying the behavior of our login view such that if a user has disabled the
  registration page -- the login page will just say 'Log In' at the top instead
  of nothing (*our old behavior*) -- this looks a lot nicer.  Big thanks to
  `@KamalAman <https://github.com/KamalAman>`_ for pointing this out.
- Adding support for custom template rendering.  Thanks to `@jmls
  <https://github.com/jmls>`_!
- Adding `@jmls <https://github.com/jmls>`_ to the contributors page, where he
  will live forever!


Version 0.6.4
-------------

**Released on February 9, 2015.**

- Fixing callback bug in middleware.
- Adding tests for ``/register`` controller.
- Fixing broken ``requireGivenName`` and ``requireSurname`` options.  These now
  work as expected.
- Removing clutter from the npm package.  Thanks @coreybutler for the PR!


Version 0.6.3
-------------

**Released on January 21, 2015.**

- Fixing slow custom data expansion issue due to old expansion implementation!


Version 0.6.2
-------------

**Released on January 13, 2015.**

- Fixing issue with the login page template when the
  ``stormpathEnableRegistration`` setting is disabled.  It now no longer renders
  a "Create Account" link when this option is disabled.


Version 0.6.1
-------------

**Released on January 12, 2015.**

- Adding integration tests, yey!
- Fixing broken Travis CI badge in the README.
- Refactoring the way our settings are initialized into their own little
  Javascript file.
- Renaming ``stormpathIDSiteVerificationFailedView`` ->
  ``stormpathIdSiteVerificationFailedView`` to be consistent with naming
  conventions.
- Adding a new option, ``stormpathDebug`` (*which defaults to false*), that
  allows users to enable extra debugging on the console.  This makes figuring
  out what's going on a lot simpler for developers.
- Adding all sorts of custom debugging messages to make working with the library
  easier.
- Using the winston library for logging across the library.


Version 0.6.0
-------------

**Released on December 24, 2014.**

- Adding a new middleware: ``authenticationRequired`` -- this lets you require
  *any form* of authentication: sessions, API key, oauth, etc.  Any will be
  accepted.  This is useful when building things like single page apps =)


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
