/**
 * stormpath-sdk-angularjs
 * Copyright Stormpath, Inc. 2015
 * 
 * @version v0.3.0-dev-2015-04-02
 * @link https://github.com/stormpath/stormpath-sdk-angularjs
 * @license Apache-2.0
 */

/* commonjs package manager support (eg componentjs) */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){
  module.exports = 'ui.router';
}

(function (window, angular, undefined) {
'use strict';
/**
 * @ngdoc overview
 * @name stormpath
 *
 * @description
 *
 *
 *
 * ## Welcome!  Let's get started
 *
 * You are reading the API documentation for the Stormpath AngularJS SDK,
 * you are moments away from sovling all kinds of user management issues
 * in your Angular application :)
 *
 * ## Installation - Bower
 *
 * If you are using [Bower](https://bower.io) you can simply install
 * our package:
 *
 * ```
 * bower install --save stormpath-sdk-angularjs
 * ```
 *
 * ## Installation - Manual
 *
 * If you would like to add the scripts manually, simply get the latest files from
 * the [dist folder on github](https://github.com/stormpath/stormpath-sdk-angularjs/tree/master/dist).
 * Then add them to the `<head>` section of your document:
 *
 * <pre>
 * <script src="stormpath-sdk-angularjs.min.js"></script>
 * <script src="stormpath-sdk-angularjs.tpls.min.js"></script>
 * </pre>
 *
 * ## Configuration
 *
 * You will need to add `stormpath` as a depenency of your Angular application,
 * and the templates if you will be using those:
 *
 * <pre>
 * <script>
 *   var myApp = angular.module('myApp', ['stormpath','stormpath.templates']);
 * </script>
 * </pre>
 *
 * ## Templates are optional
 *
 * This libray includes some default view templates for forms, such as
 * registration and login.  You have the option to specify your own templates
 * for those directives.  If you are using your own templates it does not make
 * sense to include our defaults.
 *
 * If you are using the manual installation: sipmply remove the file
 * `stormpath-sdk-angularjs.tpls.min.js`
 *
 * If you are using Bower, you can specify an override for this module
 * and only include the core javascript.  This is done inside your
 * `bower.json` file:
 *
 * <pre>
 * {
 *     // .. the rest of your bower.json ..
 *
 *   "overrides":{
 *     "stormpath-sdk-angularjs":{
 *       "main":[
 *         "dist/stormpath-sdk-angularjs.min.js"
 *       ]
 *     }
 * }
 * </pre>
 *
 */

/**
 * @ngdoc object
 * @name stormpath.SpStateConfig:SpStateConfig
 * @description
 * The Stormpath State Config is an object that you can define on a
 * state.  You will need to be using the UI Router module, and you need
 * to enable the integration by calling  {@link stormpath.$stormpath#methods_uiRouter $stormpath.uiRouter()}
 * @property {boolean} authenticate If `true`, the user must be
 * authenticated in order to view this state.  If the user is not authenticated they will
 * be redircted to the `login` state.  After they login they will be redicted to
 * the state that was originally requested.
 *
 * @property {object} authorize
 *
 * An object which defines access control rules.  Currently is supports a group-based
 * check.  See the example below
 *
 * @property {boolean} waitForUser If `true`, delay the state transition until we know
 * if the user is authenticated or not.  This is useful for situations where
 * you want everyone to see this state, but the state may look different
 * depending on the user's authentication state.
 *
 *
 * @example
 * <pre>
 *
 * angular.module('myApp')
 *   .config(function ($stateProvider) {
 *
 *     // Wait until we know if the user is logged in, before showing the homepage
 *     $stateProvider
 *       .state('main', {
 *         url: '/',
 *         sp: {
 *           waitForUser: true
 *         }
 *       });
 *
 *     // Require a user to be authenticated in order to see this state
 *     $stateProvider
 *       .state('secrets', {
 *         url: '/secrets',
 *         controller: 'SecretsCtrl',
 *         sp: {
 *           authenticate: true
 *         }
 *       });
 *
 *     // Require a user to be in the admins group in order to see this state
 *     $stateProvider
*       .state('secrets', {
 *         url: '/admin',
 *         controller: 'AdminCtrl',
 *         sp: {
 *           authorize: {
 *             group: 'admins'
 *           }
 *         }
 *       });
 * });
 * </pre>
 */
angular.module('stormpath',['stormpath.CONFIG','stormpath.auth','stormpath.userService'])
.provider('$stormpath', [function $stormpathProvider(){
  /**
   * @ngdoc object
   * @name stormpath.$stormpath
   * @description
   * This service allows you to enable application-wide features of the library.
   */

  this.$get = [
    '$user','$state','$cookieStore','STORMPATH_CONFIG','$rootScope',
    function stormpathServiceFactory($user,$state,$cookieStore,STORMPATH_CONFIG,$rootScope){

      function StormpathService(){
        var encoder = new UrlEncodedFormParser();
        this.encodeUrlForm = encoder.encode.bind(encoder);
        return this;
      }
      StormpathService.prototype.stateChangeInterceptor = function stateChangeInterceptor() {
        $rootScope.$on('$stateChangeStart', function(e,toState,toParams){
          var sp = toState.sp || {}; // Grab the sp config for this state

          if((sp.authenticate || sp.authorize) && (!$user.currentUser)){
            e.preventDefault();
            $user.get().then(function(){
              // The user is authenticated, continue to the requested state
              if(sp.authorize){
                if(authorizeStateConfig(sp)){
                  $state.go(toState.name,toParams);
                }else{
                  $rootScope.$broadcast(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHORIZED,toState,toParams);
                }
              }else{
                $state.go(toState.name,toParams);
              }
            },function(){
              // The user is not authenticated, emit the necessary event
              $rootScope.$broadcast(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHENTICATED,toState,toParams);
            });
          }else if(sp.waitForUser && ($user.currentUser===null)){
            e.preventDefault();
            $user.get().finally(function(){
              $state.go(toState.name,toParams);
            });
          }
          else if($user.currentUser && sp.authorize){

            if(!authorizeStateConfig(sp)){
              e.preventDefault();
              $rootScope.$broadcast(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHORIZED,toState,toParams);
            }

          }
        });
      };

      function authorizeStateConfig(spStateConfig){
        var sp = spStateConfig;
        if(sp && sp.authorize && sp.authorize.group) {
          return $user.currentUser.inGroup(sp.authorize.group);
        }else{
          console.error('Unknown authorize configuration for spStateConfig',spStateConfig);
          return false;
        }

      }

      /**
       * @ngdoc function
       * @name stormpath#uiRouter
       * @methodOf stormpath.$stormpath
       * @description
       * Call this method to enable the integration with the UI Router module.
       *
       * When enabled you can define {@link stormpath.SpStateConfig:SpStateConfig Stormpath State Configurations} on your UI states, this
       * object allows you to define access control for the state.  See the
       * examples below
       *
       * @param {object} config
       * * **`loginState`** - The UI state name that we should send the user
       * to if they need to login.  You'll probably use `login` for this value
       *
       * * **`autoRedirect`** - Defaults to true.  After the user logins at
       * the state defined by `loginState` they will be redirected back to the
       * state that was originally requested
       *
       * * **`defaultPostLoginState`**  - Where the user should be sent, after login,
       * if they have visited the login page directly.  If you do not define a value,
       * nothing will happen at the login state.  You can alternatively use the
       * {@link stormpath.authService.$auth#events_$authenticated $authenticated} event to know
       * that login is successful
       *
       * @example
       * <pre>
       * angular.module('myApp')
       *   .run(function($stormpath){
       *     $stormpath.uiRouter({
       *       loginState: 'login',
       *       defaultPostLoginState: 'main'
       *     });
       *   })
       * </pre>
       */
      StormpathService.prototype.uiRouter = function uiRouter(config){
        var self = this;
        config = typeof config === 'object' ? config : {};
        this.stateChangeInterceptor();
        if(config.loginState){
          self.unauthenticatedWather = $rootScope.$on(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHENTICATED,function(e,toState,toParams){
            self.postLogin = {toState:toState,toParams:toParams};
            $state.go(config.loginState);
            if(config.autoRedirect !== false){
              self.authWatcher = $rootScope.$on(STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME,function(){
                self.authWatcher(); // unregister this watecher
                if(self.postLogin){
                  $state.go(self.postLogin.toState,self.postLogin.toParams).then(function(){
                    self.postLogin = null;
                  });
                }
              });
            }
          });
        }
        if(config.defaultPostLoginState){
          self.defaultRedirectStateWatcher = $rootScope.$on(STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME,function(){
            if(!self.postLogin){
              $state.go(config.defaultPostLoginState);
            }
          });
        }
      };

      function UrlEncodedFormParser(){

        // Copy & modify from https://github.com/hapijs/qs/blob/master/lib/stringify.js

        this.delimiter = '&';
        this.arrayPrefixGenerators = {
          brackets: function (prefix) {
            return prefix + '[]';
          },
          indices: function (prefix, key) {
            return prefix + '[' + key + ']';
          },
          repeat: function (prefix) {
            return prefix;
          }
        };
        return this;
      }
      UrlEncodedFormParser.prototype.stringify = function stringify(obj, prefix, generateArrayPrefix) {

        if (obj instanceof Date) {
          obj = obj.toISOString();
        }
        else if (obj === null) {
          obj = '';
        }

        if (typeof obj === 'string' ||
          typeof obj === 'number' ||
          typeof obj === 'boolean') {

          return [encodeURIComponent(prefix) + '=' + encodeURIComponent(obj)];
        }

        var values = [];

        if (typeof obj === 'undefined') {
          return values;
        }

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          if (Array.isArray(obj)) {
            values = values.concat(this.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix));
          }
          else {
            values = values.concat(this.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix));
          }
        }

        return values;
      };
      UrlEncodedFormParser.prototype.encode = function encode(obj, options) {

        options = options || {};
        var delimiter = typeof options.delimiter === 'undefined' ? this.delimiter : options.delimiter;

        var keys = [];

        if (typeof obj !== 'object' ||
          obj === null) {

          return '';
        }

        var arrayFormat;
        if (options.arrayFormat in this.arrayPrefixGenerators) {
          arrayFormat = options.arrayFormat;
        }
        else if ('indices' in options) {
          arrayFormat = options.indices ? 'indices' : 'repeat';
        }
        else {
          arrayFormat = 'indices';
        }

        var generateArrayPrefix = this.arrayPrefixGenerators[arrayFormat];

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          keys = keys.concat(this.stringify(obj[key], key, generateArrayPrefix));
        }

        return keys.join(delimiter);
      };

      return new StormpathService();
    }
  ];
}])
.run(['$rootScope','$user','STORMPATH_CONFIG',function($rootScope,$user,STORMPATH_CONFIG){
  $rootScope.user = $user.currentUser || null;
  $user.get().finally(function(){
    $rootScope.user = $user.currentUser;
  });
  $rootScope.$on(STORMPATH_CONFIG.GET_USER_EVENT,function(){
    $rootScope.user = $user.currentUser;
  });
  $rootScope.$on(STORMPATH_CONFIG.SESSION_END_EVENT,function(){
    $rootScope.user = $user.currentUser;
  });
}])

/**
 * @ngdoc directive
 * @name stormpath.ifUser:ifUser
 *
 * @description
 * Use this directive to conditionally show an element, if the user is logged in.
 *
 * @example
 * <pre>
 * <div class="container">
 *   <h3 if-user>Hello, {{user.fullName}}</h3>
 * </div>
 * </pre>
 */
.directive('ifUser',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(user){
        if(user && user.href){
          element.show();
        }else{
          element.hide();
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 * @name stormpath.ifNotUser:ifNotUser
 *
 * @description
 * Use this directive to conditionally show an element, if the user is NOT logged in.
 *
 * @example
 * <pre>
 * <div class="container">
 *   <h3 if-not-user>Hello, you need to login</h3>
 * </div>
 * </pre>
 */
.directive('ifNotUser',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(user){
        if(user && user.href){
          element.hide();
        }else{
          element.show();
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 * @name stormpath.ifUserInGroup:ifUserInGroup
 *
 * @description
 * Use this directive to conditionally show an element if the user is logged in
 * and is a member of the group that is specified by the string
 *
 * @example
 * <pre>
 * <div class="container">
 *   <h3 if-user-in-group="admins">Hello, {{user.fullName}}, you are an administrator</h3>
 * </div>
 * </pre>
 */
.directive('ifUserInGroup',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element,attrs){
      $rootScope.$watch('user',function(){
        if($user.currentUser && $user.currentUser.inGroup(attrs.ifUserInGroup)){
          element.show();
        }else{
          element.hide();
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 * @name stormpath.ifUserNotInGroup:ifUserNotInGroup
 *
 * @description
 * Use this directive to conditionally show an element if the user is logged in
 * and is a member of the group that is specified by the string
 *
 * @example
 * <pre>
 * <div class="container">
 *   <h3 if-user-not-in-group="admins">Hello, {{user.fullName}}, please request administrator access</h3>
 * </div>
 * </pre>
 */
.directive('ifUserNotInGroup',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element,attrs){
      $rootScope.$watch('user',function(){
        if($user.currentUser && $user.currentUser.inGroup(attrs.ifUserNotInGroup)){
          element.hide();
        }else{
          element.show();
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 * @name stormpath.whileResolvingUser:while-resolving-user
 *
 * @description
 * # [DEPRECATED]
 * Please use {@link stormpath.ifUserStateUnknown:ifUserStateUnknown ifUserStateUnknown} instead
 *
 */
.directive('whileResolvingUser',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(){
        if($user.currentUser || ($user.currentUser===false)){
          element.hide();
        }else{
          element.show();
        }
      });
    }
  };
}])
/**
 * @ngdoc directive
 * @name stormpath.ifUserStateKnown:ifUserStateKnown
 *
 * @description
 * Use this directive to show an element once the user state is known.
 * The inverse of {@link stormpath.ifUserStateUnknown:ifUserStateUnknown ifUserStateUnknown}, you can
 * use this directive to show an element after we know if the user is logged in
 * or not.
 *
 * @example
 * <pre>
 * <div if-user-state-known>
 *   <li if-not-user>
 *      <a ui-sref="login">Login</a>
 *    </li>
 *    <li if-user>
 *        <a ui-sref="main" logout>Logout</a>
 *    </li>
 * </div>
 * </pre>
 */
.directive('ifUserStateKnown',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(){
        if($user.currentUser || ($user.currentUser===false)){
          element.show();
        }else{
          element.hide();
        }
      });
    }
  };
}])
/**
 * @ngdoc directive
 * @name stormpath.ifUserStateUnknown:ifUserStateUnknown
 *
 * @description
 * Use this directive to show an element, while waiting to know if the user
 * is logged in or not.  This is useful if you want to show a loading graphic
 * over your application while you are waiting for the user state.
 *
 * @example
 * <pre>
 * <div if-user-state-unknown>
 *   <p>Loading.. </p>
 * </div>
 * </pre>
 */
.directive('ifUserStateUnknown',['$user','$rootScope',function($user,$rootScope){
  return {
    link: function(scope,element){
      $rootScope.$watch('user',function(){
        if($user.currentUser === null){
          element.show();
        }else{
          element.hide();
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 * @name stormpath.spLogout:spLogout
 *
 * @description
 * This directive adds a click handler to the element.  When clicked the user will be logged out.
 *
 * @example
 * <pre>
 *   <a ui-sref="main" sp-logout>Logout</a>
 * </pre>
 */
.directive('spLogout',['$auth',function($auth){
  return{
    link: function(scope,element){
      element.on('click',function(){
        $auth.endSession();
      });
    }
  };
}]);
'use strict';
/**
 * @ngdoc overview
 * @name  stormpath.authService
 * @description
 * This module provides the {@link stormpath.authService.$auth $auth} service
 *
 * Currently this provider does not have any configuration methods
 */
/**
 * @ngdoc object
 * @name stormpath.authService.$authProvider
 * @description
 *
 * Provides the {@link stormpath.authService.$auth $auth} service
 *
 * Currently this provider does not have any configuration methods
 */
angular.module('stormpath.auth',['stormpath.CONFIG'])
.config(['$injector','STORMPATH_CONFIG',function $authProvider($injector,STORMPATH_CONFIG){
  /**
   * @ngdoc object
   * @name stormpath.authService.$auth
   * @description
   * The auth service provides methods for authenticating a user, aka
   * "logging in" the user.
   */
  var authServiceProvider = {
    $get: ['$http','$user','$rootScope','$spFormEncoder',function authServiceFactory($http,$user,$rootScope,$spFormEncoder){

      function AuthService(){
        return this;
      }
      AuthService.prototype.authenticate = function authenticate(data) {
        /**
         * @ngdoc function
         * @name  stormpath.authService.$auth#authenticate
         * @methodOf stormpath.authService.$auth
         * @param {Object} credentialData An object literal for passing
         * usernmae & password, or social provider token
         * @description
         * Sends the provided credential data to your backend server, the server
         * handler should verify the credentials and return an access token which is
         * store in an HTTP-only cookie.
         * @returns {promise} A promise which is resolved with the authntication
         * response or error response (both are response objects from the $http
         * service).
         * @example
         * ## Username & Password example
         * <pre>
         * myApp.controller('LoginCtrl', function ($scope, $auth, $state) {
         *   $scope.errorMessage = null;
         *   $scope.formData = {
         *     username: '',         // Expose to user as email/username field
         *     password: '',
         *   };
         *
         *   // Use this method with ng-submit on your form
         *   $scope.login = function login(formData){
         *     $auth.authenticate(formData)
         *      .then(function(){
         *        console.log('login success');
         *        $state.go('home');
         *      })
         *      .catch(function(httpResponse){
         *        $scope.errorMessage = response.data.message;
         *      });
         *   }
         *
         * });
         * </pre>
         */
        var op = $http($spFormEncoder.formPost({
            url: STORMPATH_CONFIG.AUTHENTICATION_ENDPOINT,
            method: 'POST',
            withCredentials: true,
            data: data,
            params: {
              'grant_type': 'password'
            }
          })
        );
        var op2 = op.then(cacheCurrentUser).then(authenticatedEvent);
        op.catch(authenticationFailureEvent);
        return op2;

      };

      AuthService.prototype.endSession = function endSession(){
        var op = $http.get(STORMPATH_CONFIG.DESTROY_SESSION_ENDPOINT);
        op.then(function(){
          $rootScope.$broadcast(STORMPATH_CONFIG.SESSION_END_EVENT);
        },function(response){
          console.error('logout error',response);
        });
        return op;
      };

      function cacheCurrentUser(){
        return $user.get();
      }

      function authenticatedEvent(response){
        /**
         * @ngdoc event
         * @name stormpath.authService.$auth#$authenticated
         * @eventOf stormpath.authService.$auth
         * @eventType broadcast on root scope
         * @description
         * This event is broadcast when a call to
         * {@link stormpath.authService.$auth#methods_authenticate $auth.authenticate()}
         * is successful
         *
         * @param {Object} event Angular event object.
         * @param {httpResponse} httpResponse The http response from the $http service.  If
         * you are writing your access tokens to the response body when a user
         * authenticates, you will want to use this response object to get access
         * to that token.
         *
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME,response);
      }
      function authenticationFailureEvent(response){
        $rootScope.$broadcast(STORMPATH_CONFIG.AUTHENTICATION_FAILURE_EVENT_NAME,response);
      }
      return new AuthService();
    }]
  };

  $injector.get('$provide')
    .provider(STORMPATH_CONFIG.AUTH_SERVICE_NAME,authServiceProvider);

}]);

'use strict';

angular.module('stormpath.CONFIG',[])
.constant('STORMPATH_CONFIG',{
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
});

'use strict';

angular.module('stormpath')

.controller('SpEmailVerificationCtrl', ['$scope','$stateParams','$user',function ($scope,$stateParams,$user) {
  $scope.showVerificationError = false;
  $scope.verifying = false;
  $scope.reVerificationSent = false;
  $scope.needsReVerification = false;
  $scope.resendFailed = false;
  $scope.formModel = {
    username: ''
  };
  if($stateParams.sptoken){
    $scope.verifying = true;
    $user.verify({sptoken:$stateParams.sptoken})
      .then(function(){
        $scope.verified = true;
      })
      .catch(function(){
        $scope.needsReVerification = true;
        $scope.showVerificationError = true;
      })
      .finally(function(){
        $scope.verifying = false;
      });
  }else{
    $scope.needsReVerification = true;
    $scope.showVerificationError = true;
  }
  $scope.submit = function(){
    $scope.posting = true;
    $scope.resendFailed = false;
    $scope.showVerificationError = false;
    $user.resendVerificationEmail({login: $scope.formModel.username})
      .then(function(){
        $scope.reVerificationSent = true;
      })
      .catch(function(){
        $scope.resendFailed = true;
      }).finally(function(){
        $scope.posting = false;
      });
  };
}])

/**
 * @ngdoc directive
 * @name stormpath.spEmailVerification:spEmailVerification
 *
 * @description
 *
 * Use this directive on the page that users land on when they click an email verification link.
 * These links are sent after a user registers, see
 * {@link stormpath.spRegistrationForm:spRegistrationForm spRegistrationForm}
 *
 * This directive will render a view which does the following:
 * * Verifies that the current URL has an `sptoken` in it.  Shows an error if not.
 * * Verifies the given `sptoken` with Stormpath, then:
 *   * If the token is valid, tell the user that confirmation is complete and prompt the user to login.
 *   * If the token is invalid (it is expired or malformed) we prompt the user to enter
 *     their email address, so that we can try sending them a new link.
 *
 * @param {string} template-url An alternate template URL, if you want
 * to use your own template for the form.
 *
 * @example
 * <pre>
 * <!-- If you want to use the default template -->
 * <div class="container">
 *   <div sp-email-verification></div>
 * </div>
 *
 * <!-- If you want to use your own template -->
 * <div class="container">
 *   <div sp-email-verification template-url="/path/to/my-custom-template.html"></div>
 * </div>
 * </pre>
 */
.directive('spEmailVerification',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spEmailVerification.tpl.html';
    },
    controller: 'SpEmailVerificationCtrl'
  };
});

'use strict';

angular.module('stormpath')
.provider('$spFormEncoder', [function $spFormEncoder(){
  /**
   * This service is intenally exclude from NG Docs
   * It is an internal utility
   */

  this.$get = [
    'STORMPATH_CONFIG',
    function formEncoderServiceFactory(STORMPATH_CONFIG){

      function FormEncoderService(){
        var encoder = new UrlEncodedFormParser();
        this.encodeUrlForm = encoder.encode.bind(encoder);
        return this;
      }

      FormEncoderService.prototype.formPost = function formPost(httpRequest){
        if(STORMPATH_CONFIG.FORM_CONTENT_TYPE!=='application/json'){
          var h = httpRequest.headers ? httpRequest.headers : (httpRequest.headers = {});
          h['Content-Type'] = 'application/x-www-form-urlencoded';
          httpRequest.data = this.encodeUrlForm(httpRequest.data);
        }
        return httpRequest;
      };

      function UrlEncodedFormParser(){

        // Copy & modify from https://github.com/hapijs/qs/blob/master/lib/stringify.js

        this.delimiter = '&';
        this.arrayPrefixGenerators = {
          brackets: function (prefix) {
            return prefix + '[]';
          },
          indices: function (prefix, key) {
            return prefix + '[' + key + ']';
          },
          repeat: function (prefix) {
            return prefix;
          }
        };
        return this;
      }
      UrlEncodedFormParser.prototype.stringify = function stringify(obj, prefix, generateArrayPrefix) {

        if (obj instanceof Date) {
          obj = obj.toISOString();
        }
        else if (obj === null) {
          obj = '';
        }

        if (typeof obj === 'string' ||
          typeof obj === 'number' ||
          typeof obj === 'boolean') {

          return [encodeURIComponent(prefix) + '=' + encodeURIComponent(obj)];
        }

        var values = [];

        if (typeof obj === 'undefined') {
          return values;
        }

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          if (Array.isArray(obj)) {
            values = values.concat(this.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix));
          }
          else {
            values = values.concat(this.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix));
          }
        }

        return values;
      };
      UrlEncodedFormParser.prototype.encode = function encode(obj, options) {

        options = options || {};
        var delimiter = typeof options.delimiter === 'undefined' ? this.delimiter : options.delimiter;

        var keys = [];

        if (typeof obj !== 'object' ||
          obj === null) {

          return '';
        }

        var arrayFormat;
        if (options.arrayFormat in this.arrayPrefixGenerators) {
          arrayFormat = options.arrayFormat;
        }
        else if ('indices' in options) {
          arrayFormat = options.indices ? 'indices' : 'repeat';
        }
        else {
          arrayFormat = 'indices';
        }

        var generateArrayPrefix = this.arrayPrefixGenerators[arrayFormat];

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          keys = keys.concat(this.stringify(obj[key], key, generateArrayPrefix));
        }

        return keys.join(delimiter);
      };

      return new FormEncoderService();
    }
  ];
}]);
'use strict';

angular.module('stormpath')

.controller('SpLoginFormCtrl', ['$scope','$auth',function ($scope,$auth) {
  $scope.formModel = {
    username: '',
    password: ''
  };
  $scope.posting = false;
  $scope.submit = function(){
    $scope.posting = true;
    $scope.error = null;
    $auth.authenticate($scope.formModel)
      .catch(function(response){
        $scope.posting = false;
        $scope.error = response.data.errorMessage;
      });
  };
}])


/**
 * @ngdoc directive
 * @name stormpath.spLoginForm:spLoginForm
 *
 * @description
 * This directive will render a pre-built login form, with all
 * the necessary fields.  After the login is a success, the following
 * will happen:
 *
 * * The {@link stormpath.authService.$auth#events_$authenticated $authenticated} event will
 * be fired.
 * *  If you have configured the {@link stormpath.$stormpath#methods_uiRouter UI Router Integration},
 * the following can happen:
 *  * The user is sent back to the view they originally requested
 *  * The user is sent to a default view of your choice
 *
 * @param {string} template-url An alternate template URL, if you want
 * to use your own template for the form.
 *
 * @example
 * <pre>
 * <!-- If you want to use the default template -->
 * <div class="container">
 *   <div sp-login-form></div>
 * </div>
 *
 * <!-- If you want to use your own template -->
 * <div class="container">
 *   <div sp-login-form template-url="/path/to/my-custom-template.html"></div>
 * </div>
 * </pre>
 */
.directive('spLoginForm',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spLoginForm.tpl.html';
    },
    controller: 'SpLoginFormCtrl'
  };
});
'use strict';

angular.module('stormpath')
.controller('SpPasswordResetRequestCtrl', ['$scope','$stateParams','$user',function ($scope,$stateParams,$user) {
  $scope.sent = false;
  $scope.posting = false;
  $scope.formModel = {
    username: ''
  };
  $scope.requestFailed = false;
  $scope.submit = function(){
    $scope.posting = true;
    $scope.requestFailed = false;
    $user.passwordResetRequest({username: $scope.formModel.username})
      .then(function(){
        $scope.sent = true;
      })
      .catch(function(){
        $scope.requestFailed = true;
      }).finally(function(){
        $scope.posting = false;
      });
  };
}])

.controller('SpPasswordResetCtrl', ['$scope','$stateParams','$user',function ($scope,$stateParams,$user) {
  var sptoken = $stateParams.sptoken;
  $scope.showVerificationError = false;
  $scope.verifying = false;
  $scope.verified = false;
  $scope.posting = false;
  $scope.reset = false;
  $scope.error = null;

  $scope.resendFailed = false;
  $scope.formModel = {
    password: '',
    confirmPassword: ''
  };

  if(sptoken){
    $scope.verifying = true;
    $user.verifyPasswordResetToken(sptoken)
      .then(function(){
        $scope.verified = true;
      })
      .catch(function(){
        $scope.showVerificationError = true;
      })
      .finally(function(){
        $scope.verifying = false;
      });
  }else{
    $scope.showVerificationError = true;
  }
  $scope.submit = function(){
    if($scope.formModel.password!==$scope.formModel.confirmPassword){
      $scope.error = 'Passwords do not match';
      return;
    }
    $scope.posting = true;
    $scope.error = null;
    $scope.showVerificationError = false;
    $user.resetPassword(sptoken, {password: $scope.formModel.password})
      .then(function(){
        $scope.reset = true;
      })
      .catch(function(response){
        $scope.error = response.data.errorMessage;
      }).finally(function(){
        $scope.posting = false;
      });
  };

}])

/**
 * @ngdoc directive
 * @name stormpath.spPasswordResetRequestForm:spPasswordResetRequestForm
 *
 * @description
 * This directive will render a pre-built form which prompts the user for thier
 * username/email.  If an account is found we will send them an email with a
 * password reset link.
 *
 * @param {string} template-url An alternate template URL, if you want
 * to use your own template for the form.
 *
 * @example
 * <pre>
 * <!-- If you want to use the default template -->
 * <div class="container">
 *   <div sp-password-reset-request-form></div>
 * </div>
 *
 * <!-- If you want to use your own template -->
 * <div class="container">
 *   <div sp-password-reset-request-form template-url="/path/to/my-custom-template.html"></div>
 * </div>
 * </pre>
 */
.directive('spPasswordResetRequestForm',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spPasswordResetRequestForm.tpl.html';
    },
    controller: 'SpPasswordResetRequestCtrl'
  };
})
/**
 * @ngdoc directive
 * @name stormpath.spPasswordResetForm:spPasswordResetForm
 *
 * @description
 * Use this directive on the page that users land on when they click on a password
 * reset link.  To send users a password reset link, see
 * {@link stormpath.spPasswordResetRequestForm:spPasswordResetRequestForm spPasswordResetRequestForm}
 *
 * This directive will render a password reset form which does the following:
 * * Verifies that the current URL has an `sptoken` in it.  Shows an error if not.
 * * Verifies the given `sptoken` with Stormpath, then:
 *   * If the token is valid, show a form which allows the user to enter a new password.
 *   * If the token is invalid (it is expired or malformed) we prompt the user to enter
 *     their email address, so that we can try sending them a new link.
 *
 * @param {string} template-url An alternate template URL, if you want
 * to use your own template for the form.
 *
 * @example
 * <pre>
 * <!-- If you want to use the default template -->
 * <div class="container">
 *   <div sp-password-reset-form></div>
 * </div>
 *
 * <!-- If you want to use your own template -->
 * <div class="container">
 *   <div sp-password-reset-form template-url="/path/to/my-custom-template.html"></div>
 * </div>
 * </pre>
 */
.directive('spPasswordResetForm',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spPasswordResetForm.tpl.html';
    },
    controller: 'SpPasswordResetCtrl'
  };
});

'use strict';

angular.module('stormpath')
.controller('SpRegistrationFormCtrl', ['$scope','$user','$auth','$state',function ($scope,$user,$auth,$state) {
  $scope.formModel = (typeof $scope.formModel==='object') ? $scope.formModel : {
    givenName:'',
    surname: '',
    email: '',
    password: ''
  };
  $scope.created = false;
  $scope.enabled = false;
  $scope.creating = false;
  $scope.authenticating = false;
  $scope.submit = function(){
    $scope.creating = true;
    $scope.error = null;
    $user.create($scope.formModel)
      .then(function(enabled){
        $scope.created = true;
        $scope.enabled = enabled;
        if(enabled && $scope.autoLogin){
          $scope.authenticating = true;
          $auth.authenticate({
            username: $scope.formModel.email,
            password: $scope.formModel.password
          })
          .then(function(){
            if($scope.postLoginState){
              $state.go($scope.postLoginState);
            }
          })
          .catch(function(response){
            $scope.error = response.data.errorMessage;
          })
          .finally(function(){
            $scope.authenticating = false;
            $scope.creating = false;
          });
        }else{
          $scope.creating = false;
        }
      })
      .catch(function(response){
        $scope.creating = false;
        $scope.error = response.data.errorMessage;
      });
  };
}])


/**
 * @ngdoc directive
 * @name stormpath.spRegistrationForm:spRegistrationForm
 *
 * @param {boolean} autoLogin Default `false`, automatically authenticate the user
 * after creation.  This makes a call to
 * {@link stormpath.authService.$auth#methods_authenticate $auth.authenticate} which will
 * trigger the event {@link stormpath.authService.$auth#events_$authenticated $authenticated}.
 * This is not
 * possible if the email verification workflow is enabled on the directory that
 * the account is created in.
 *
 * @param {string} postLoginState If using the `autoLogin` option, you can
 * specify the name of a UI state that the user should be redirected to after
 * they successfully register
 *
 * @description
 * This directive will render a pre-built user registration form with the following
 * fields:
 *  * First Name
 *  * Last Name
 *  * Email
 *  * Password
 *
 * # Customizing the form
 *
 * If you would like to customize the form:
 *
 * * Create a new view file in your application
 * * Copy our default template into your file, found here:
 * <a href="https://github.com/stormpath/stormpath-sdk-angularjs/blob/master/src/spRegistrationForm.tpl.html" target="_blank">spRegistrationForm.tpl.html</a>
 * * Modify the template to fit your needs, making sure to use `formModel.<FIELD>` as the
 * value for `ng-model`, where `.<FIELD>` is the name of the field you want to set on
 * the new account (such as
 * `middleName`)
 * * Use the `template-url` option on the directive to point to your new view file
 *
 * If you would like to add Custom Data to the new account, you can add form inputs to the template
 * and use `formModel.customData.<FIELD>` as the value for `ng-model`
 *
 * # Email Verification
 *
 * If you are using the email verification workflow the default template has a message
 * which will be shown to the user, telling them that they need to check their email
 * for verification.
 *
 * If you are NOT using the email verification workflow you can, optionally,
 * automatically login the user and redirect them to a UI state in your application.
 * See the options below.
 *
 *
 * # Server Interaction
 *
 * This directive makes a call to
 * {@link stormpath.userService.$user#methods_create $user.create()}
 * when it is ready to POST the form to the server, please see that method
 * for more information.
 *
 * @param {string} template-url An alternate template URL, if you want
 * to use your own template for the form.
 *
 * @example
 * <pre>
 * <!-- If you want to use the default template -->
 * <div class="container">
 *   <div sp-registration-form post-login-state="main"></div>
 * </div>
 *
 * <!-- If you want to use your own template -->
 * <div class="container">
 *   <div sp-registration-form template-url="/path/to/my-custom-template.html"></div>
 * </div>
 * </pre>
 */
.directive('spRegistrationForm',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spRegistrationForm.tpl.html';
    },
    controller: 'SpRegistrationFormCtrl',
    link: function(scope,element,attrs){
      scope.autoLogin = attrs.autoLogin==='true';
      scope.postLoginState = attrs.postLoginState || '';
    }
  };
});
'use strict';
/**
 * @ngdoc overview
 * @name stormpath.userService
 * @description
 *
 * This module provides the {@link stormpath.userService.$user $user} service
 */

/**
 * @ngdoc object
 * @name stormpath.userService.$userProvider
 * @description
 *
 * Provides the {@link stormpath.userService.$user $user} service
 *
 * Currently this provider does not have any configuration methods
 */

angular.module('stormpath.userService',['stormpath.CONFIG'])
.provider('$user', [function $userProvider(){

  /**
   * @ngdoc object
   * @name stormpath.userService.$user
   *
   * @description
   * Use this service to get the current user and do access control checks
   * on the user
   */

  function User(data){
    var self = this;
    Object.keys(data).map(function(k){
      self[k] = data[k];
    });
  }
  User.prototype.inGroup = function inGroup(groupName) {
    return this.groups.filter(function(group){
      return group.name === groupName;
    }).length >0;
  };

  this.$get = [
    '$q','$http','STORMPATH_CONFIG','$rootScope','$spFormEncoder',
    function userServiceFactory($q,$http,STORMPATH_CONFIG,$rootScope,$spFormEncoder){
      function UserService(){
        this.cachedUserOp = null;
        this.currentUser = null;
        return this;
      }
      UserService.prototype.create = function(accountData){
        /**
         * @ngdoc function
         * @name stormpath.userService.$user#create
         * @methodOf stormpath.userService.$user
         * @param {Object} accountData An object literal for passing the data
         * for the new account.
         *
         * Required fields:
         * * `givenName` - the user's first name
         * * `surname` - the user's last name
         * * `email` - the email address of the user
         * * `password` - the password that the user wishes to use for their
         * account.  Must meet the password requirements that you have specified
         * on the directory that this account will be created in.
         * @description
         *
         * Attemps to create a new user by submitting the given `accountData` as
         * JSON to `/api/users`.  The POST endpoint can be modified via the
         * {@link stormpath.config#USER_COLLECTION_URI USER_COLLECTION_URI} config option.
         *
         * This method expects a `201` response if the account does NOT require email
         * verification.
         *
         * If email verification is enabled, you should send a `202` response instead.
         *
         *  If you are using our Express.JS SDK you can simply attach the
         *  <a href="https://github.com/stormpath/stormpath-sdk-express#register" target="_blank">`register`</a> middleware
         * to your application and these responses will be handled automatically for you.
         *
         * @returns {promise} A promise representing the operation to create a
         * new user.  If an error occurs (duplicate email, weak password) the
         * promise will be rejected and the http response will be passed.
         * If the operation is successful the promise
         * will be resolved with a boolean `enabled` value.
         *
         * * If `true`, the
         * account's status is Enabled and you can proceed with authenticating the user.
         *
         * * If `false`, the account's status is Unverified.
         * This will be the case when you have
         * enabled the email verification workflow on the directory of this
         * account.
         *
         * @example
         * <pre>
         * $user.create(accountData)
         *   .then(function(created){
         *     if(created){
         *       // The account is enabled and ready to use
         *     }else{
         *       // The account requires email verification
         *     }
         *   })
         *   .catch(function(response){
         *     // Show the error message to the user
         *     $scope.error = response.data.errorMessage;
         *   });
         * </pre>
         */
        var op = $q.defer();

        $http($spFormEncoder.formPost({
            url: STORMPATH_CONFIG.USER_COLLECTION_URI,
            method: 'POST',
            data: accountData
          }))
          .then(function(response){
            op.resolve(response.status===201);
          },op.reject);
        return op.promise;
      };
      UserService.prototype.get = function get() {
        /**
         * @ngdoc function
         * @name stormpath.userService.$user#get
         * @methodOf stormpath.userService.$user
         * @description
         *
         * Attempt to get the current user.  Returns a promise.  If the user
         * is authenticated the promise will be resolved with the user object.
         * If the user is not authenticated the promise will be rejected and
         * passed the error response from the $http service.
         *
         * If you cannot make use of the promise you can also obseve the
         * {@link $notLoggedin $notLoggedin} or {@link $currentUser $currentUser}
         * events.  They are emitted when this method has a success or failure.
         *
         * The user object is a Stormpath Account
         * object which is wrapped by by a {@link eh User} type
         *
         * @returns {promise} A promise representing the operation to get the current user data
         *
         * @example
         * <pre>
         * var myApp = angular.module('myApp', ['stormmpath']);
         *
         * myApp.controller('MyAppCtrl', function ($scope, $user) {
         *   $user.get()
         *     .then(function (user) {
         *       console.log('The current user is', user);
         *     })
         *     .catch(function (error) {
         *       console.log('Error getting user', error);
         *     });
         * });
         * </pre>
         *
         */
        var op = $q.defer();
        var self = this;

        if(self.cachedUserOp){
          return self.cachedUserOp.promise;
        }
        else if(self.currentUser !== null && self.currentUser!==false){
          op.resolve(self.currentUser);
          return op.promise;
        }else{
          self.cachedUserOp = op;

          $http.get(STORMPATH_CONFIG.CURRENT_USER_URI).then(function(response){
            self.cachedUserOp = null;
            self.currentUser = new User(response.data);
            currentUserEvent(self.currentUser);
            op.resolve(self.currentUser);
          },function(response){
            self.currentUser = false;
            if(response.status===401){
              notLoggedInEvent();
            }
            self.cachedUserOp = null;
            op.reject(response);
          });
          return op.promise;
        }

      };
      UserService.prototype.resendVerificationEmail = function resendVerificationEmail(data){
        return $http($spFormEncoder.formPost({
          method: 'POST',
          url: STORMPATH_CONFIG.RESEND_EMAIL_VERIFICATION_ENDPOINT,
          data: data
        }));
      };
      UserService.prototype.verify = function verify(data){
        return $http($spFormEncoder.formPost({
          method: 'POST',
          url: STORMPATH_CONFIG.EMAIL_VERIFICATION_ENDPOINT,
          data: data
        }));
      };
      UserService.prototype.verifyPasswordResetToken = function verifyPasswordResetToken(token){
        return $http.get(STORMPATH_CONFIG.PASSWORD_RESET_TOKEN_COLLECTION_ENDPOINT+'/'+token);
      };
      UserService.prototype.passwordResetRequest = function passwordResetRequest(data){
        return $http($spFormEncoder.formPost({
          method: 'POST',
          url: STORMPATH_CONFIG.PASSWORD_RESET_TOKEN_COLLECTION_ENDPOINT,
          data: data
        }));
      };
      UserService.prototype.resetPassword = function resetPassword(token,data){
        return $http($spFormEncoder.formPost({
          method: 'POST',
          url: STORMPATH_CONFIG.PASSWORD_RESET_TOKEN_COLLECTION_ENDPOINT+'/'+token,
          data: data
        }));
      };
      function currentUserEvent(user){
        /**
         * @ngdoc event
         * @name stormpath.userService.$user#$currentUser
         * @eventOf stormpath.userService.$user
         * @eventType broadcast on root scope
         * @description
         * This event is broadcast when a call to
         * {@link stormpath.userService.$user#methods_get $user.get()}
         * results in a {@link User User} object
         *
         * See the next section, the $notLoggeInEvent, for example usage
         *
         * @param {Object} event Angular event object.
         * @param {User} user The current user object
         *
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.GET_USER_EVENT,user);
      }
      function notLoggedInEvent(){
        /**
         * @ngdoc event
         * @name stormpath.userService.$user#$notLoggedIn
         * @eventOf stormpath.userService.$user
         * @eventType broadcast on root scope
         * @description
         * This event is broadcast when a call to
         * {@link stormpath.userService.$user#methods_get $user.get()}
         * results in an authentication failure
         *
         * This event is useful for situations where you want to trigger
         * the call to get the current user, but need to respond to it
         * from some other place in your application.  An example could be
         * during application bootstrap: you make a single call to get the current
         * user from the run function, then react to it inside your
         * application controller.
         *
         * @param {Object} event Angular event object.
         *
         * @example
         * <pre>
         * var myApp = angular.module('myApp', ['stormmpath']);
         * myApp.run(function($user){
         *   //
         *   // Once our app is ready to run, trigger a call to $user.get()
         *   // We can then do other things while we wait for the result
         *   //
         *   $user.get();
         * });
         * myApp.controller('MyAppCtrl', function ($scope, $rootScope) {
         *   $scope.isVisible = false; // Wait for authentication
         *   $rootScope.$on('$notLoggedIn',function(){
         *      $state.$go('login');
         *   });
         *   $rootScope.$on('$currentUser',function(e,user){
         *      $scope.isVisible = true;
         *   });
         *
         * });
         * </pre>
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.NOT_LOGGED_IN_EVENT);
      }

      var userService =  new UserService();
      $rootScope.$on(STORMPATH_CONFIG.SESSION_END_EVENT,function(){
        userService.currentUser = false;
      });
      return userService;
    }
  ];
}]);
})(window, window.angular);