# 0.3.0

## Breaking Changes

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

## New Features

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

## Bug Fixes

* [`whileResolvingUser`](https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.whileResolvingUser:while-resolving-user)
would break after logout (user state was not properly reflected after logout)