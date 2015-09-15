# 0.6.0

### Breaking Changes

Stormpath's password reset API accepts email address only,
not username.  This library was allowing a username to be
sent, but that will not work.  If using the [Stormpath Express SDK]
you will also need to update that library to `>=0.5.0`

# 0.5.5

Fix a redirect loop in the state change interceptor

# 0.5.4

Fix an undefined attribute bug with the group membership directives

# 0.5.3

Adding social login support.  **NOTE**: this is overloading oauth grant_type,
and we will change this API in the future so use with this disclaimer.

### Bug Fixes

# 0.5.2

### Improvements

* Remove un-used `$cookieStore` depdency

### Bug Fixes

* The config option FORM_CONTENT_TYPE was not being used to modify
  the body of the request (only the content-type header)

# 0.5.1

### Bug Fixes

The `defaultPostLoginState` option was not being used by the SDK, but now it is!

# 0.5.0

### New Features

XHR requests now set the `withCredentials` option to `true`, allowing you to
make cross-domain requests that will send the `access_token` and `XSRF-TOKEN`
cookies.  Your server must respond with the necessary
[Cross-Origin-Resource-Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) headers.
If you are using our Express SDK this is done by specifying
[Allowed Origins on spConfig](https://github.com/stormpath/stormpath-sdk-express#allowedOrigins)

# 0.4.1

### New Features

The UI Router integration now accepts a `forbiddenState` option, this is the
state we will send the user to if they are unauthorized for a given state.
This is useful if you want to show a default "Forbidden" view in these
situations.

Added documentation for the [$stateChangeUnauthenticated] and
[$stateChangeUnauthorized] events!

# 0.4.0

### Breaking Changes

The [ifUserInGroup] and [ifUserNotInGroup] directives now requires you to pass
either a string expression or a reference to a scope variable.  I.E. this will
now throw a parse exception unless `admin` is a reference to a scope property:

```html
<div if-user-in-group="admin">Hello, Administrator</div>
```

It should be re-written to be a string expression with quotes:

```html
<div if-user-in-group="'admin'">Hello, Administrator</div>
```

## New Features

The [ifUserInGroup] and [ifUserNotInGroup] directives now support regular
expressions :)

See the documentation of [ifUserInGroup] for more information

# 0.3.0

### Breaking Changes

* The `logout` directive is renamed to
[`spLogout`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spLogout:spLogout)

* The registration form now uses property names of
`givenName` and `surname`, instead of `firstName` and `lastName`

* Form submissions now use `application/x-www-form-urlencoded` as the Content Type.
Your server needs to negotiate this type, if you are using our server SDKs this happens
for you.  If you wish to continue using `application/json` as the Content
Type you can define `STORMPATH_CONFIG.FORM_CONTENT_TYPE='application/json'` in a
config block

## Deprecation Notices

* [`whileResolvingUser`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.whileResolvingUser:while-resolving-user)
is deprecatead.  Use
[`ifUserStateKnown`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUserStateKnown:ifUserStateKnown)
instead.

### New Features

* **Custom Data on Registration**.  You can now pass custom data during
registration, simply reference `formModel.customData.myCustomProperty` in your
`ng-model` directive.  This is only possible if you are supplying a custom
template to the directive.  See the
[`spRegistrationForm`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spRegistrationForm:spRegistrationForm)
directive for more detail.

* **Group-Based Access Control**.  This can now control access to UI Routes,
based on group membership.  See
[`SpStateConfig`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.SpStateConfig:SpStateConfig)
for examples.  We've also introduced the
[`ifUserInGroup`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUserInGroup:ifUserInGroup)
and
[`ifUserNotInGroup`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUserNotInGroup:ifUserNotInGroup)
directives.

### Bug Fixes

* [`whileResolvingUser`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.whileResolvingUser:while-resolving-user)
would break after logout (user state was not properly reflected after logout)

[Stormpath Express SDK]: https://github.com/stormpath/stormpath-sdk-express
[$stateChangeUnauthenticated]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.$stormpath#events_$statechangeunauthenticated
[$stateChangeUnauthorized]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.$stormpath#events_$statechangeunauthorized
[ifUserInGroup]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUserInGroup:ifUserInGroup
[ifUserNotInGroup]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUserNotInGroup:ifUserNotInGroup