'use strict';

module.exports = {
  collectFormErrors: require('./collect-form-errors'),
  exchangeStormpathToken: require('./exchange-stormpath-token'),
  createStormpathSession: require('./create-stormpath-session'),
  createSession: require('./create-session'),
  defaultJsonErrorResponder: require('./default-json-error-responder'),
  expandAccount: require('./expand-account'),
  getFormModel: require('./get-form-model'),
  getRequiredRegistrationFields: require('./get-required-registration-fields'),
  getUser: require('./get-user'),
  getAppModuleVersion: require('./get-app-module-version'),
  handleContentTypeRequest: require('./handle-content-type-request'),
  writeJsonError: require('./write-json-error'),
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
  getLoginViewModel: require('./get-login-view-model').default
};
