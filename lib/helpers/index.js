'use strict';

module.exports = {
  authenticate: require('./authenticate'),
  collectFormErrors: require('./collect-form-errors'),
  exchangeStormpathToken: require('./exchange-stormpath-token'),
  createStormpathSession: require('./create-stormpath-session'),
  createSession: require('./create-session'),
  expandAccount: require('./expand-account'),
  getHost: require('./get-host'),
  getRequiredRegistrationFields: require('./get-required-registration-fields'),
  getUser: require('./get-user'),
  getAppModuleVersion: require('./get-app-module-version'),
  handleAcceptRequest: require('./handle-accept-request'),
  writeJsonError: require('./write-json-error'),
  writeFormError: require('./write-form-error'),
  loginResponder: require('./login-responder'),
  loginWithOAuthProvider: require('./login-with-oauth-provider'),
  prepAccountData: require('./prep-account-data'),
  render: require('./render'),
  bodyParser: require('./body-parser'),
  sanitizeFormData: require('./sanitize-form-data'),
  setTempCookie: require('./set-temp-cookie'),
  validateAccount: require('./validate-account'),
  xsrfValidator: require('./xsrf-validator'),
  revokeToken: require('./revoke-token'),
  getFormViewModel: require('./get-form-view-model').default,
  strippedAccountResponse: require('./stripped-account-response')
};
