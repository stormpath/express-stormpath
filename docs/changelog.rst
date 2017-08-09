.. _changelog:


Change Log
==========

All library changes, in descending order.

Version 4.0.0
-----------------

**Released July 21, 2017**

This major version is meant to be used if:

 - You are a Stormpath customer that is migrating to Okta `(learn more) <https://stormpath.com/oktaplusstormpath>`_.
 - You have successfully exported your tenant data from Stormpath `(learn more) <https://stormpath.com/export>`_.
 - You plan to imported your data into Okta `(learn more) <https://developer.okta.com/documentation/stormpath-import>`_.

We suggest following the instructions in the `Express Stormpath Sample Project <https://github.com/stormpath/express-stormpath-sample-project/>`_
to setup a sample project with this version and your Okta org.  This will help give you confidence that everything is working before embarking on your data import.

This 4.0.0 release includes all the changes in the 4.0.0-rc releases, as well as some fixes since RC4.  If you are trying this version for the first time,
please read down through each RC to learn about the breaking changes that will affect your code.


New changes since RC4:

* **Caching of JWKs.**  Similar to Stormpath, we validate access tokens when a request presents them for authentication.
  At Okta we now use RSA keys and the JWKs endpoint to do this validation, for more information please see `Validating Access Tokens`_.
  In this release, we have included a JWKS cache manager, to allow you to control how long the JWKs are cached for, and the default is 1 hour.
  To configure the TTL of the JWKS cache manager:

  .. code-block:: javascript

    app.use(stormpath.init(app, {
      web: {
        defaultJwksCacheManagerConfig: {
          ttl: 60000 // milliseconds, one hour
        }
      }
    }));
* **Configurable access token location search**.  The default behavior of this library has been to search for an access token in the Authorization header, then in cookies.
  If you need to change this ordering, you can now pass this configuration:

  .. code-block:: javascript

    app.use(stormpath.init(app, {
      web: {
        authentication: {
          accessTokenSearchLocations: ['cookie', 'header']
        }
      }
    }));
* **Improved authentication error messages**.  Previous RC releases would give opaque error messages during authentication.  We now attempt to pass down as much error information as possible.
* **Refresh token cookies are being set**.  Previous RC releases were not setting the refresh token cookie, like was done with Stormpath.
  This has been fixed, however you will need to tell the library how long the refresh token should exist in the browser for.
  By default we now create it as a session cookie.  If you wish for the cookie to persist after browser close, you will need to set the max-age of the cookie with this configuration:

  .. code-block:: javascript

    app.use(stormpath.init(app, {
      web: {
        refreshTokenCookie: {
          maxAge: 60000 // milliseconds, one hour
        }
      }
    }));

* **Remote validation option**.  Previous RC releases would not use a remote ("stormpath") validation option if configured, this is now fixed.  Please see the
  `Token Validation Strategy`_ for a description of the remote validation behavior.
* **User caching is re-implemented**.  Previous RC releases did not have a working cache for user resources.  This version has a working cache for user resources.
* **Test data script fixes**.  The test data script has been fixed to match the new API for managing authorization servers.


Version 4.0.0-rc4
-----------------

**Released June 16, 2017**

This release candidate builds on top of the prior release candidates, 4.0.0-rc3, 4.0.0-rc2, and 4.0.0-rc1, by adding support for the following features, using the Okta platform:

**Informative: OAuth Server Migration**

The Stormpath API provided an OAuth server for each Stormpath application, and this library provides an ``/oauth/token`` endpoint, which proxied the request to the OAuth server of the configured Stormpath application.  This proxy behavior is now patched to work with Okta's `Authorization Servers`_.  The `stormpath-migration tool`_ will create one authorization server for each application that is migrated.

**Breaking Changes for the /oauth/token endpoint**

* Access token requests must now be an OpenID Connect (OIDC) request, as such the ``openid`` scope must be added to the request if you want an access token.  Internally we add this for you if no scope has been added to the request.
* It is no longer possible to make use of the `scope factory feature`_ to add custom scopes to the issued tokens.  The scope claim of access tokens will reflect what you requested of the authorization server.
* Refresh tokens are no longer issued automatically.  If you want to get a refresh token while doing ``grant_type=password``, you need to add the ``offline_access`` scope to the request.
* Refresh tokens are now opaque, and do not contain references to the authenticated subject.  However the `Introspection Request`_ endpoint can be used to get information about the subject.
* Pre and Post Login handlers have not been implemented in this version for this route.  Please contact us if you need this feature.

**Fixes for API Keys**

In 4.0.0-rc2 we introduced patches to allow users to continue using their Stormpath API Keys for API authentication.  There were some bugs in the patch that prevented this form working.  We've also patched ``account.createApiKey()`` in the underlying 1.0.0-rc4 version of the Stormpath Node SDK.  It will add new API keys by creating secure random values that are stored on the user's profile object.

Version 4.0.0-rc3
-----------------

**Released May 1, 2017**

This release candidate builds on top of the prior release candidate, 4.0.0-rc2 and 4.0.0-rc1, by adding support for the following features, using the Okta platform:

- Social login for page-based redirect flows.  Popup/implicit flows will be supported in a future release.

Please read the changelog for the previous 4.0.0-rc2 and 4.0.0-rc1 release (below) for a full list of breaking changes on the 4.x series.

**Social Login Changelog**

- The data import tool will copy the metadata about your social providers into Okta, and create them as Identify Provider (IdP) resources.  The following providers are supported:

  - Facebook
  - Google
  - Linkedin

  Unfortunately, Github and generic Oauth2 providers are not supported at this time.

- After the data import tool runs, you will need to do the following:

  - Visit Admin -> Security -> Identity Providers in the Okta Admin Console.  Each IdP has an Okta-specific redirect URI.  In the Okta flow, the user is sent through Okta before coming back to your application.  As such, you will need to add this redirect URI as an allowed URI with the provider. For example you will need to login to the Google Apps console, or Facebook Developer site, and add this redirect URI to your application.
  - Visit Applications in the Okta Admin Console, and find the Application that was created for your Stormpath application.  You will need to add the following redirect URIs to the whitelist, one for each provider that you are using.  These are the final redirect handlers on your server that are provided by the ``express-stormpath`` library:

    - ``http://<your-app-domain>/callbacks/facebook``
    - ``http://<your-app-domain>/callbacks/google``
    - ``http://<your-app-domain>/callbacks/linkedin``

- This new flow is using OpenID Connect under the hood, as such we've added the ``email openid profile`` scope as a default scope.  If you are providing scopes manually you may need to add that scope to your list.

Version 4.0.0-rc2
-----------------

**Released April 20, 2017**

This release candidate builds on top of the prior release candidate, 4.0.0-rc1, by adding support for the following features, using the Okta platform:

- Group authorization, using the ``groupsRequired`` middleware.
- API Key Authentication (Client Credentials Grant Flow).

Please read the changelog for the 4.0.0-rc1 release (below) for a full list of breaking changes on the 4.x series.

**How API Keys Are Being Migrated**

Okta does not provide API Keys on a per-account basis.  As such, the data import tool (available by end of April) will migrate API Keys onto the user's profile as custom attributes.  For example, if a user has multiple API Keys you will see this in their profile data, where the API Key is encoded as an ``id:secret`` string:

  .. code-block:: javascript

    "stormpathApiKey_1": "6T7N8RH4R168UF4MLRv1SYIT1:w0qxffEwie3Tf+eqdxpD7Ad5bp4uYbRlrkX/kcMs1Ag",
    "stormpathApiKey_2": "4ZTYOE6IJ6RQEEYDZ2NX4WM1Y:xSD4C3AENM2gAHKNcT5mXGdfT/8nF4Wfl0FBwe4gTg8"

We've patched ``application.authenticateApiRequest()`` in the Stormpath Node SDK to look for the API keys in their new location, so the Client Credentials grant flow should continue to work as-is for you.

**Breaking Changes for API Keys**

- By default, this library will start using your Okta API Token as the secret that is used to verify and sign access tokens that are generated by the Client Credentials grant type.  This means that existing tokens, issued by Stormpath, won't validate.  If you want to validate those tokens, please add the ``STORMPATH_CLIENT_APIKEY_SECRET`` back to your configuration, and provide the API Key secret that you are currently using.  If we see this option provided, we will use that key for signing an verification.
- API Keys will lose their metadata (name and custom data), only the ID and Secret will be preserved by the import tool.
- Stormpath provided the ability to encrypt the API Key resource in transit from the Stormpath REST API, and we would store the encrypted values in the local cache.  This is no longer possible, as the values are now stored as plaintext values on the user profile.
- Disabled api keys will not be imported.

Version 4.0.0-rc1
-----------------

**Released April 13, 2017**

This major version will help you migrate to the Okta platform.  We have strived
to preserve the functionality that you have come to depend on through Stormpath,
while transparently switching you to the Okta platform.  This version assumes
that you are using the data migration tool to export your data from your Stormpath
Tenant, and import it into your Okta organization (this tool will be public soon,
please contact us for early access).  You can also use the `Test Data Script`_
to create some test data in your Okta tenant, allowing you to test basic
functionality against before working on your data import.

**Features available in this RC**

These features have been patched and should be working in this RC, although some require changes to your code:

* Login with password.
* Registration of new accounts.
* Email verification workflow (see changes below).
* Password reset workflow (see changes below).
* Get and save custom data for account resources.
* Logout.

**Features NOT available in this RC**

These features will be coming in the next RC:

* Group-based authorization with the ``groupsRequired`` middleware.
* Social login.
* Client-credentials authentication for Account API Keys.

**Features NOT being migrated**

Please see the "Compatibility Matrix" on the `Stormpath-Okta Customer FAQ`_ for a complete list of features that are not being migrated.  The relevant points for this library are:

* Subdomain-based multi-tenancy, as introduced by version 3.2.0, will not be migrated.  If you are using this feature please contact support@stormpath.com so that we can help you find a solution.
* ID Site as a feature will not be migrated, so you will not be able to use this library to log users in with ID Site.
* Custom data will only be available on account resources.  If you are storing custom data on a group, directory, organization or application, you will need to move that data into your own persistence layer.


**Configuration Changes**

To use this version, please sign up for a developer account at http://developer.okta.com.
You will be walked through the setup of an Okta Organization, which is similar to
a Stormpath Tenant.

Since you will be using the Okta platform, the Stormpath API Key and application
configuration must be removed.  In it's place you will need to configure the
following properties:

- **API Token**: similar to the Stormpath API Key, this is a secret that is used
  to secure the communication with the Okta platform.  You can create an API token
  from the Admin Console of your Okta organization.
- **Application Id**: This is the ID of the Okta Application that represents your application.
  If using the test data script, and application is created for you and the ID is logged in the console.
  If using the `stormpath-migration tool`_ it will create an application for each of your Stormpath applications.
  You can discover the ID of the application by finding the application in the Okta Admin Console, and looking in the URL bar when viewing the application.
- **Org**:  In Stormpath you had a Tenant, and in Okta you have an Org.  Every
  Org has it's own distinct URL.  This URL is sent to you when you sign up for
  your developer account, and it is also used to login to the Admin Console for
  your organization.

These new properties should be provided like so:

.. code-block:: javascript

  app.use(stormpath.init(app, {
    org: 'https://dev-YOUR-ID.oktapreview.com/',
    application: {
      id: 'your-okta-applicaton-id'
    },
    apiToken: 'your-okta-api-token'
  }));

Or through the following environment variables:

.. code-block:: sh

  OKTA_APITOKEN
  OKTA_APPLICATION_ID
  OKTA_ORG

**Breaking Changes**

- The underlying `Stormpath Node SDK`_ is undergoing major changes and is being used as the primary adapter between the Stormpath and Okta data models.  It is currently in a release candidate state as well, but we do not yet have a robust changelog.  If your Express application is reaching down into the Node SDK, e.g. using ``req.app.get('stormpathApplication')`` or ``req.app.get('stormpathClient')``, please know that the returned objects are now unstable.  We will have more clarity around this soon.  Please contact us if you run into errors, it will be helpful to know which areas are causing problems.

- Custom data properties must be declared on the Okta User Schema.  If you have used the ``web.register.form.fields`` configuration to add custom properties to your registration form, you will need to use the Okta Admin Console to add these to the user schema.  This can be found under Directory -> Profile Editor.  The data migration tool will inspect your existing accounts and attempt to create these schema properties for you.  You can also use the `Okta Schema API`_ to do this programmatically.

- Email verification has several major changes:

  - This feature is no longer available on a per-directory basis, and you must configure it locally in your server configuration.  It will now be disabled by default unless explicitly enabled with the ``web.register.emailVerificationRequired`` option (see example below).

  - You will have to send the email verification message to your users. Stormpath was able to send this email for you, but this is not yet available in Okta.  We've provided a new option for you to pass an ``emailVerificationHandler``, this handler will be called when a new user registers, or when a user is asking for the verification email to be re-sent.  This function is passed the account, which will have the email verification token that you need to send to the user.  See example below.


  - The email verification token is still found on the ``account.emailVerificationToken.href`` property like before, but it no longer has a full URL in front of it.  We've retained an initial forward slash in case you were using this as part of a Regular Expression when looking for the token.

    Here is how the configuration for email verification should now look:

    .. code-block:: javascript

      app.use(stormpath.init(app, {
        web: {
          register: {
            emailVerificationRequired: true
          }
        },
        emailVerificationHandler: function(account) {
          /**
           * Drop the initial slash from the token, then append it to the verification URL
           * of your application.  Then send this link to the user by email.
           */

          var token = account.emailVerificationToken.href.slice(1);

          var verificationUrl = 'http://www.example.com/verify?sptoken=' + token;

          var userEmail = account.email;

          var message = 'To verify you account please visit: ' + verificationUrl;

          sendEmail({        // pseudo code, sendEmail must be provided by you
            to: userEmail,
            message: message
          });
        },

      }));

- Forgot password flow has several changes:

  - This feature is no longer available on a per-directory basis, and you must configure it locally in your server configuration.  This feature will now be disabled by default, unless you manually enable it with these options:

    .. code-block:: javascript

      app.use(stormpath.init(app, {
        web: {
          changePassword: {
            enabled: true
          },
          forgotPassword: {
            enabled: true
          }
        }
      }));

  - You will need to re-create the email template for the password reset email.  You can copy the current template from the Stormpath Admin Console, then in the Okta console you can paste it into the template found at Settings > Email & SMS > Forgot Password.  You'll want to use the ``${recoveryToken}`` variable to create a link that points the user to the verification endpoint on your application, for example: ``http://localhost:3000/change?sptoken=${recoveryToken}``.

  - The expiration time for password reset tokens is now 59 minutes, this can be configured through the Okta Admin Console, see Security -> Policies -> Default Policy.

  - Password recovery confirmation emails will not be sent, this type of email template is currently not available.  Please let us know if you need this feature and we can provide a hook in this library that will let you send this message manually.

**Potentially Breaking Changes**

- Okta uses an API Token to authenticate its API, similar to Stormpath's API Key ID/Secret.  However the Okta API Tokens will expire in 30 days if they are not used.  This means that if your application is not used for 30 days it will fail because the API Token will no longer be valid.

- ``req.user`` is now populated from the Okta User, which will contain a new set
  of default properties that Stormpath did not have.  We've copied the relevant
  Okta properties onto their Stormpath counterparts (e.g. ``firstName``, ``lastName``,
  and ``customData``), however there will be new properties that did not exist before.
  Please evaluate how you are using ``req.user`` to ensure that the new properties
  won't break your code.


Version 3.2.0
-------------

**Released January 25, 2017.**

- Added support for subdomain-based multi-tenancy, please see the new "Multi Tenancy" section of the documentation.
- Added support for tokens generated by the Client API, these tokens will now authenticate against your Express application, if your Express application is using the same Stormpath Application that issued the token through the Client API.
- Deprecated the ``loginRequired`` middleware, please use ``authenticationRequired`` instead.

Version 3.1.9
-------------

**Released January 20, 2017.**

- The following production dependencies have been updated:

  - ``stormpath-config@0.0.26`` -> ``stormpath-config@0.0.27``

Version 3.1.8
-------------

**Released December 22, 2016.**

- The following production dependencies have been updated:

  - ``stormpath@^0.18.5`` -> ``stormpath@0.19.x``

Version 3.1.7
-------------

**Released December 7, 2016.**

* Fixed a regression with social login, whereby Linkedin login was not working, and our library would conflict with your own usage of ``cookieParser()``, causing an error about signed cookies, as described in `#542 <https://github.com/stormpath/express-stormpath/issues/542>`_.
* The login form fields can now be customized with configuration (`#536 <https://github.com/stormpath/express-stormpath/issues/536>`_).
* Pre and Post handlers can now be used with OAuth2 provider login flows (`#522 <https://github.com/stormpath/express-stormpath/issues/522>`_, `#515 <https://github.com/stormpath/express-stormpath/issues/515>`_).
* Improved ID Site redirect flow when parsing the current host behind a proxy. (`#537 <https://github.com/stormpath/express-stormpath/issues/537>`_).
* Improved documentation of ``stormpath.init()`` (`#520 <https://github.com/stormpath/express-stormpath/issues/520>`_).

Version 3.1.6
-------------

**Released November 1, 2016.**

* Fix for broken scope string for social login providers.  If you are getting errors about invalid scope configuration from Google, Facebook, etc, you should upgrade to this version. (`#539 <https://github.com/stormpath/express-stormpath/pull/539>`_).
* Fixed so that login with social providers will support the ``?next`` query string parameter. (`#482 <https://github.com/stormpath/express-stormpath/pull/482>`_).

Version 3.1.5
-------------

**Released August 11, 2016.**

- The following dependencies have been updated:

  - ``stormpath@^0.18.3`` -> ``stormpath@^0.18.5``
  - ``stormpath-config@0.0.23`` -> ``stormpath-config@^0.0.24``

Version 3.1.4
-------------

**Released August 10, 2016.**

- Fixed: Hostname was not resolved correctly if it included a port, and was
  behind a reverse-proxy (`#498 <https://github.com/stormpath/express-stormpath/pull/498>`_).

- Fixed: Pre/Post Login & Registration handlers were not called during a social
  login flow (`#466 <https://github.com/stormpath/express-stormpath/pull/466>`_).

- Fixed: Token cookies were not created after auto-login when resetting password
  (`#465 <https://github.com/stormpath/express-stormpath/pull/465>`_).

- Fixed: res.render() was not called with the full view path, causing "not found"
  errors when the custom view filename had multiple periods.
  (`#462 <https://github.com/stormpath/express-stormpath/pull/462>`_).

- Added error logging for token exchange errors, to help debug ID Site callback
  issues (`#474 <https://github.com/stormpath/express-stormpath/pull/474>`_).

- The following dependencies have been updated:

  - ``async@1.4.2`` -> ``async@2.0.1``
  - ``njwt@0.3.0`` -> ``njwt@0.3.1``


Version 3.1.3
-------------

**Released June 27, 2016.**

- Fixed: The ``groupsRequired`` middleware would only render text/html responses
  for error messages.  It now renders JSON error messages if the client has
  requested JSON. (`#429 <https://github.com/stormpath/express-stormpath/pull/429>`_)

- Fixed: When deleting cookies during logout, we did not send the cookie options
  that were provided by the developer (e.g. the domain of the cookie).  These
  options are now sent on the logout response.
  (`#444 <https://github.com/stormpath/express-stormpath/pull/444>`_)

- Fixed: The configurable cookie name for the access token and refresh token
  cookies was not being used.
  (`#422 <https://github.com/stormpath/express-stormpath/pull/422>`_)

- The following dependencies have been updated:

  - ``njwt@0.2.3`` -> ``njwt@0.3.0``
  - ``stormpath-config@0.0.22`` -> ``stormpath-config@0.0.23``
  - ``stormpath@0.18.2`` -> ``stormpath@0.18.3``


Version 3.1.2
-------------

**Released March 30, 2016.**

- Fixed: the JSON API for the password reset workflow was not accepting valid
  ``sptoken`` values.  This regression was introduced in 3.1.0 but is now fixed
  in this release.

Version 3.1.1
-------------

**Released March 24, 2016.**

- Patch release for ``apiAuthenticationRequired``, it was not respecting the
  ``local`` token validation option, ``stormpath`` would always be used.  This
  is now fixed.

- The following dependencies have been updated:

  - ``stormpath@0.18.0`` -> ``stormpath@0.18.2``

Version 3.1.0
-------------

**Released March 23, 2016.**

This minor release includes several new features, and a handful of bug fixes.
No changes are required from this change.

**New Handlers!**

We've added more handlers to the library, to make it easier for you to work
with the login and registration flows.

- The :ref:`post_logout_handler` allows you to run custom code after a user has
  logged out.

- The :ref:`pre_login_handler` will run before we perform the authentication
  attempt, allowing you to make custom decisions about who can log in to your
  site.

- The :ref:`pre_registration_handler` allows you to read the posted
  registration form, and run custom code or modify the data before we create the
  new account.

**Bug Fixes**

- The ``logger`` option was not being observed, and your custom logger was not
  used even if it was passed in with this option.  This is now fixed.

- The ``apiAuthenticationRequired`` middleware is now checking the Stormpath
  REST API to ensure that access tokens have not been deleted.  As of 3.0.0, you
  must use the ``stormpath`` option for
  ``web.oauth2.password.validationStrategy`` to achieve this behavior.

- The JSON API for the password reset workflow would not pro-actively error
  if the ``sptoken`` was invalid, the user would have to submit the form to see
  the error.  This is now fixed.

- Custom registration fields were not included in the view model if they were
  not also defined in ``web.register.form.fieldOrder``.  They will now appear in
  the view model, at the end of the defined field order.

**Other Improvements**

- The confirm password field is now supported during registration, you can
  require the user to confirm their new password by setting
  ``web.register.form.fields.confirmPassword.enabled`` to ``true``.

- The Facebook Login callback can now accept authorization codes, as well as
  access tokens.  This allows you to perform both types of Facebook
  authentication (pop-up based, or page-based) when a user is signing in with
  Facebook.

- The account object is now purged from the local cache (managed by the
  `Stormpath Node SDK`_) when a user logs out.

- Updated the documentation to explain all the default options, in the
  Configuration section.

- The view model cache, for the login and registration pages, is now
  pre-warmed on startup.  This yields a faster load time for your front-end
  applications that need to request these view models from the server.

**Dependency Updates**

- ``cookies@^0.5.0`` -> ``cookies@^0.6.1``
- ``lodash@^4.1.0`` -> ``lodash@^4.6.1``
- ``deep-extend@^0.4.0`` -> ``deep-extend@^0.4.1``
- ``js-yaml@^3.4.3`` -> ``js-yaml@^3.5.4``

Version 3.0.1
-------------

**Released March 2, 2016.**

- The following dependencies have been updated:

  - ``stormpath@0.17.4`` -> ``stormpath@0.17.5``
  - ``stormpath-config@0.0.21`` -> ``stormpath-config@0.0.22``

Major Release 3.0.0
-------------------
This major release of our Express.js integration is introducing changes for
better network performance and easier configuration.  We're also updating several
configuration options and view models to conform with our framework
specification, thus making it easier to integrate our front-end clients with our
back-end libraries.

Please see the :ref:`upgrading` for a comprehensive list of breaking changes that you will
need to address when upgrading to this major version.  This changelog entry will
discuss the major changes at a higher level.

.. note::

  At the time of writing, we are still updating our Angular and React libraries
  to be compatible with this 3.0.0 version.  If you are using our Angular or React
  libraries, please continue using the 2.4.0 version of this library for the
  time being.  We expect to have those libraries ready within one week of this
  release.

Configuration Changes
.....................

There are many configuration changes in this release, and you should see the
:ref:`upgrading` for a full list.  The biggest change is the removal of the
``website`` and ``api`` options.  In the 2.x series, you would
need the ``website`` option if you wanted to use the common feature set of
login, registration, and password reset:

.. code-block:: javascript

  stormpath.init({
    website: true
  });

If you wanted to use our ``/oauth/token`` endpoint, you would need to enable
that with this different ``api`` option:

.. code-block:: javascript

  stormpath.init({
    api: true
  });


This is no longer necessary!  You can now initialize the library without
options, and the following features will be turned on by default:

- Current User Route (``/me``)
- Email Verification*
- Login
- OAuth2 Token Endpoint
- Password Reset*
- Registration


*\*(if enabled on the directory)*

.. note::

  It is still possible to disable the features that you don't want to use.  For
  example, if you wanted to disable the OAuth Token Endpoint:

     .. code-block:: javascript

      app.use(stormpath.init(app, {
        web: {
          oauth2: {
            enabled: false
          }
        }
      }));

  For a full reference of features that can be disabled, please see the
  `Web Configuration Defaults`_.

There are other configuration changes, which are simple property name changes,
but are breaking changes nonetheless.  Please see :ref:`upgrading` for a full
list of changes in the 3.0.0 release.

Performance Changes
...................

In the 2.x series, one of the common request was "how do I make authentication
faster?"  As such, we've changed the following default options for this
library.

**Local Token Validation Is Now the Default**.

When a user logs in to your website with a web browser, we create OAuth2 Access
and Refresh Tokens for the session and store them in cookies.  These tokens
would then be used to authenticate API requests against your server. In the 2.x
version, we used ``stormpath`` validation by default.  In this scheme, on each request
we would check against the Stormpath REST API to ensure that the access tokens had not
been revoked.

This would add the network time of a REST API call, which was undesirable.  As such,
we are changing to ``local`` validation by default.  With local validation, we do
not hit the REST API for every authentication attempt.  Instead we do a server-side
check in your server, where we only check the signature and expiration of the
access token.  If you do not wish to make this trade-off, you will need to set
the option ``stormpath.web.oauth2.password.validationStrategy`` to ``stormpath``.

For more information please see :ref:`token_validation_strategy`.

**We Don't Attempt Authentication for All Routes, by Default**.

In the 2.x series, we would attempt to authenticate *all requests* to your
application, even if you didn't use an explicit middleware like
``stormpath.loginRequired``.  The result was that ``req.user`` was always available,
if the user was logged in.  This was convenient, but if you did not need this
feature you would end up with a lot of authentication overhead for routes that
did not need it, like your public asset routes.

In 3.0.0 we no longer do this.  If you need to know if a user is logged in or
not, please add the ``stormpath.getUser`` middleware to your route.

For more information please see :ref:`getUser`.

New Features
.............

**"Produces" Option, for Configuring HTML or JSON**

The 2.x version was difficult to configure if you had a special Single-Page-App
(SPA) case, and you did not want our library to render default HTML pages for
you. Sometimes you just need some JSON API :)

In this version, we now have this configuration option:

.. code-block:: javascript

  {
    web: {
      produces: ['application/json', 'text/html']
    }
  }

This configuration tells our library which types of content it should serve, for
the routes that it handles by default.  If you do not want our default pages to
interfere with your SPA architecture, simply remove ``text/html`` from the list.

**JSON View Models for Login and Registration**

Another change, for SPA support, is the addition of proper JSON view models for
our login and registration features.  In 2.x, it was not possible for your
front-end to know how it should render these views.  Stormpath allows you to
dynamically add login sources, and your application needs to know what account
stores are available so that the login and registration views can be shown
correctly.

You can now issue GET requests against ``/login`` and ``/register``, with the
header ``Accept: application/json`` and receive this information as a JSON
view model.  For more information please see the :ref:`json_login_api` and
the :ref:`json_registration_api`.

**GitHub Login Is Now Supported**

Yay! :)

Bug Fixes
.........

- Added no-cache headers to the ``/me`` route.  Some browsers were caching this
  response, which would cause front-end frameworks to think that the user was
  still logged in.

- During registration, the first and last name of an account would be set to
  UNKNOWN, when those fields were marked optional, even if the user had supplied
  those values.

Version 2.4.0
-------------

**Attention: Minor release that affects ID Site and Social Users**

**Released February 8, 2016.**

We have improved security and consistency for our ID Site and Social
integrations.  These integrations now receive the same access token and refresh
token cookies that you see when logging in with password-based authentication.

Please see the :ref:`upgrading` for potential issues for users who are currently
logged in.

This minor release does introduce a **known bug**: auto-login for registration
will *not* work if the user is returning from ID Site.  This is due to a
limitation in the Stormpath REST API, and we should have this resolved in the
next 2-4 weeks.  Once resolved in the REST API, this feature will start working
again without any changes needed.

Also fixed: If the user attempts to login with a social provider, but does not
provide email permission, we now show this error on the login form (Stormpath
requires the email address of the user as our unique constraint on accounts in
directories).  Previously we dumped a JSON error message, which was not a good
user experience.

In addition, the following dependencies have been updated:

  - ``lodash@4.0.1`` -> ``lodash@4.1.0``
  - ``stormpath@0.16.0`` -> ``stormpath@0.17.1``



Version 2.3.7
-------------

**Released January 29, 2016.**

- Fixed: This library would set ``req.body`` to an empty object, for all
  requests to the application that was passed to ``stormpath.init()``.  This
  caused problems for users of ``body-parser`` and ``rocky`` modules.  This bug
  was introduced in 2.3.5 but is now fixed.

- Fixed: JSON error messages from the registration controller are now setting
  the status code from the upstream error.  Previously it was always 400.

- Documentation update: better descriptions of required environment variables.

- Metrics: we now collect the Express version from the version of Express that
  is found in ``node_modules`` folder of the application path (not the path that
  is local to this module).

- The following dependencies have been updated:

  - ``stormpath-config@0.0.16`` -> ``stormpath-config@0.0.18``
  - ``express@4.13.3`` -> ``express@4.13.4``

Version 2.3.6
-------------

**Released January 21, 2016.**

- Fixing bug with IDsite registration: previously if you tried to register a new
  account using IDsite, you'd get an error page when you were re-directed back
  to your application :(
- Fixing JSON error responses in registration controller: we're now passing the
  error back through the middleware chain properly.


Version 2.3.5
--------------

**Released January 12, 2016**

- Added: Info about changed routes in upgrade docs from v1 to v2.

- Fixed: Ability to disable web features while still having the website
  option turned on.

- Fixed: Body-parser conflicts when configured outside the library. Now
  instead of using body-parser, we use the body and qs modules.

- Fixed: Express-stormpath incompatible with node streams (request.pipe and
  http-proxy).

- Fixed: Previously it was possible to set your own `next` url. Now any `next`
  url redirects are restricted to the domain that you are on.

Version 2.3.4
--------------

**Released December 21, 2015**

- Fixed: if you specify an application that does not have account stores mapped
  to it, we show a nice error message (rather than an undefined exception).
  We also added a real error message for the situation where the registration
  feature is enabled, but the defined application does not have a default
  account store.

- Fixed: when rendering error messages for field validation, during
  registration, we use the field label (rather than the name) in the error
  string (this is more user friendly).

- The logout route now supports  `?next=<url>` parameter, for redirecting after
  logout.

- Adding more information to the upgrade log, for the 1.x -> 2.x upgrade path.

Version 2.3.3
--------------

**Released December 11, 2015**

- Fixed: the secure flag on OAuth2 cookies would always be set to false, due to
  a configuration parsing error.  This is now fixed, and configuration will be
  respected.  If no configuration is defined, we default to secure if the
  request protocol is https.

Version 2.3.2
--------------

**Released December 7, 2015**

- Fixed: if there is an error during the Facebook login callback, the error is
  now rendered (before it was crashing the Express application, due to a bad
  template reference).


Version 2.3.1
--------------

**Released December 7, 2015**

- Local JWT validation can now be configured by setting
  ``web.oauth2.password.validationStrategy`` to ``local``.  Please see
  :ref:`token_validation_strategy` for more information.

- Registration fields now have a ``label`` property, allowing you to modify the
  text label that is shown for the field.  Please see :ref:`custom_form_fields`
  for more information.

- Fixed: the :ref:`post_registration_handler` and :ref:`post_login_handler` are
  now called when a user is authenticated with Google or Facebook.

Version 2.3.0
--------------

**Released on November 20, 2015.**

Many fixes for the registration field configuration:

- Custom fields, as defined in the ``register`` block, will now appear in our
  default registration form (they were not appearing before).

- Custom fields now *must* be defined in the ``register`` block, otherwise the
  data will be rejected during account creation.

- Only the First Name, Last Name, Email, and Password fields are shown by
  default (the middle name and username fields are no longer shown by default).

- Added an ``enabled`` property to all fields, allowing you to selectively
  disable any of the default fields.

- The default value for first name and last name is now "UNKNOWN", if not
  provided and not required during registration.

Please see the Registration section of this documentation for more information.

Several bug fixes:

- The `spaRoot` option was not observed by the change password route, so you
  would get the standard HTML page and not your angular application.

- On logout, access tokens and refresh tokens are now revoked via the Stormpath
  REST API (this was not the case before - the token would not be revoked).

- The social login sidebar was being shown on the login page, even if there were
  no buttons to show.  This is now fixed.

Configuration loading changes:

- We now have *much* better error messages if there is a problem with the
  Stormpath application that is provied in your configuration.

- If no application is defined and your Stormpath tenant has only one default
  application, we will automatically use that applicaton.  Woot!


Version 2.2.0
--------------

**Released on November 6, 2015.**

- Implemented the password grant flow on the ``/oauth/token`` endpoint, this will
  be useful for mobile applications and single-page applications that don't use
  cookie authentication

- The OAuth2 token endpoint is now enabled by default

Version 2.1.0
--------------

**Released on October 30, 2015.**

- Internal refactor of config parser.
- Social login support for front-end applications.
- Fixing postLogin / postRegistration handlers not being fired when using Google
  / LinkedIn logins.  Thanks to `@cdaniel <https://github.com/cdaniel>`_ for the
  pull request!
- Adding `@cdaniel <https://github.com/cdaniel>`_ to the contributors list.


Version 2.0.14
--------------

**Released on October 18, 2015.**

- Testing new documentation deployment stuff.
- No code changes.


Version 2.0.13
--------------

** Released on October 18, 2015.**

- Testing new documentation deployment stuff.
- No code changes.


Version 2.0.12
--------------

**Released on October 16, 2015.**

- Fixed bug that caused /logout to send you to ID site if you had logged in via a directory provider.


Version 2.0.11
--------------

**Released on October 9, 2015.**

- Fixing google login so that it creates a local session
- Fixing registration to allow ``givenName`` and ``surname`` to be populated as
  ``Anonymous``, from JSON requests

Version 2.0.10
--------------

**Released on October 8, 2015.**

- Fixing the ``postRegistrationHandler``, it is now called even if ``config.web.register.autoLogin`` is ``false``.  It now receives an expanded account object.
- Fixing the ``postLoginHandler``, it now receives an expanded account object.

Version 2.0.9
-------------

**Released on October 7, 2015.**

- Fixing support for client_credentials workflow, with account keys
- Fixing bug with customData expansion.
- Fixing ``/forgot`` JSON endpoint to accept an ``email`` property.  Previously
  was ``username`` but this is incorrect: the Stormpath API only accepts an
  email address for the forgot password workflow.
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
  session if a request is made within the active duration time frame. This
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
  when the Stormpath middleware is initialized, we'll create one automatically.
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
- Fixing issue with session max duration.  Adding in a workaround to get around
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

.. _Authorization Servers: https://developer.okta.com/use_cases/api_access_management/
.. _Introspection Request: https://developer.okta.com/docs/api/resources/oidc.html#introspection-request
.. _Okta User Status: http://developer.okta.com/docs/api/resources/users.html#user-status
.. _Okta Schema API:  http://developer.okta.com/docs/api/resources/schemas.html
.. _scope factory feature: https://docs.stormpath.com/nodejs/jsdoc/ScopeFactoryAuthenticator.html
.. _stormpath-migration tool: https://github.com/okta/stormpath-migration
.. _Stormpath Node SDK: https://github.com/stormpath/stormpath-sdk-node
.. _Stormpath-Okta Customer FAQ: https://stormpath.com/oktaplusstormpath
.. _Validating Access Tokens: https://developer.okta.com/standards/OAuth/index.html#validating-access-tokens
.. _Web Configuration Defaults: https://github.com/stormpath/express-stormpath/blob/master/lib/config.yml
.. _Test Data Script: https://github.com/stormpath/express-stormpath/blob/4.0.0/util/okta-test-data.js
.. _Token Validation Strategy: http://localhost:3333/authentication.html#validation-strategy
