'use strict';

angular.module('stormpath.CONFIG',[])
.constant('STORMPATH_CONFIG',{
  AUTHENTICATION_ENDPOINT: '/oauth/token',
  CURRENT_USER_URI: '/api/users/current',
  DESTROY_SESSION_ENDPOINT: '/logout',
  GET_USER_EVENT: '$currentUser',
  SESSION_END_EVENT: '$sessionEnd',
  UNAUTHORIZED_EVENT: 'unauthorized',
  LOGIN_STATE_NAME: 'login',
  FORBIDDEN_STATE_NAME: 'forbidden',
  AUTHENTICATION_SUCCESS_EVENT_NAME: '$authenticated',
  AUTHENTICATION_FAILURE_EVENT_NAME: '$authenticationFailure',
  AUTH_SERVICE_NAME: '$auth',
  NOT_LOGGED_IN_EVENT: '$notLoggedin'
});
