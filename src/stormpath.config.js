'use strict';

angular.module('stormpath.CONFIG',[])
.constant('STORMPATH_CONFIG',(function stormpathConfigBuilder(){
  var c={
    ENDPOINT_PREFIX: '',
    AUTHENTICATION_ENDPOINT: '/oauth/token',
    CURRENT_USER_URI: '/api/users/current',
    USER_COLLECTION_URI: '/api/users',
    DESTROY_SESSION_ENDPOINT: '/logout',
    RESEND_EMAIL_VERIFICATION_ENDPOINT: '/api/verificationEmails',
    EMAIL_VERIFICATION_ENDPOINT: '/api/emailVerificationTokens',
    PASSWORD_RESET_TOKEN_COLLECTION_ENDPOINT: '/api/passwordResetTokens',
    GET_USER_EVENT: '$currentUser',
    SESSION_END_EVENT: '$sessionEnd',
    UNAUTHORIZED_EVENT: 'unauthorized',
    LOGIN_STATE_NAME: 'login',
    FORBIDDEN_STATE_NAME: 'forbidden',
    AUTHENTICATION_SUCCESS_EVENT_NAME: '$authenticated',
    AUTHENTICATION_FAILURE_EVENT_NAME: '$authenticationFailure',
    AUTH_SERVICE_NAME: '$auth',
    NOT_LOGGED_IN_EVENT: '$notLoggedin',
    STATE_CHANGE_UNAUTHENTICATED: '$stateChangeUnauthenticated',
    STATE_CHANGE_UNAUTHORIZED: '$stateChangeUnauthorized',
    FORM_CONTENT_TYPE: ''
  };
  c.getUrl = function(key) {
    return this.ENDPOINT_PREFIX + this[key];
  };
  return c;
})());
