/**
 * stormpath-sdk-angularjs
 * Copyright Stormpath, Inc. 2015
 * 
 * @version v0.1.0-dev-2015-03-03
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
    $get: ['$http','$user','$rootScope',function authServiceFactory($http,$user,$rootScope){

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
        var op = $http.post(
          STORMPATH_CONFIG.AUTHENTICATION_ENDPOINT,
          data,
          {
            withCredentials: true,
            params: {
              'grant_type': 'password'
            }
          }
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
  STATE_CHANGE_UNAUTHORIZED: '$stateChangeUnauthorized'
});

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
 *             group: ['admins']
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
        return this;
      }
      StormpathService.prototype.stateChangeInterceptor = function stateChangeInterceptor() {
        $rootScope.$on('$stateChangeStart', function(e,toState,toParams){
          var sp = toState.sp || {}; // Grab the sp config for this state
          if((sp.authenticate || sp.authorize) && (!$user.currentUser)){
            e.preventDefault();
            $user.get().then(function(){
              // The user is authenticated, continue to the requested state
              $state.go(toState.name,toParams);
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
            if((Object.keys(sp.authorize).length === 1) && sp.authorize.group){
              if(!$user.currentUser.inGroup(sp.authorize.group)){
                e.preventDefault();
                return $rootScope.$broadcast(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHORIZED,toState,toParams);
              }
            }else{
              console.error('Unknown authorize configuration for state',toState);
            }
          }
        });
      };
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

      return new StormpathService();
    }
  ];
}])
.run(['$rootScope','$user',function($rootScope,$user){
  $rootScope.user = $user.currentUser || null;
  $user.get().finally(function(){
    $rootScope.user = $user.currentUser;
  });
  $rootScope.$on('$currentUser',function(e,user){
    $rootScope.user = user;
  });
  $rootScope.$on('$sessionEnd',function(){
    $rootScope.user = null;
  });
}])

.controller('SpRegistrationFormCtrl', ['$scope','$user','$auth','$state',function ($scope,$user,$auth,$state) {
  $scope.formModel = {
    firstName:'',
    lastName: '',
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
 * @name stormpath.spRegistrationForm:sp-registration-form
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
 * If you are using the email verification workflow: this form will tell the user
 * that they need to check their email to complete their registration.
 *
 * If you are NOT using the email verification workflow: you can, optionally,
 * automatically login the user and redirect them to a UI state in your application.
 * See the options below.
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
})

.directive('spPasswordResetRequestForm',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spPasswordResetRequestForm.tpl.html';
    },
    controller: 'SpPasswordResetRequestCtrl'
  };
})

.directive('spPasswordResetForm',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spPasswordResetForm.tpl.html';
    },
    controller: 'SpPasswordResetCtrl'
  };
})

/**
 * @ngdoc directive
 * @name stormpath.spLoginForm:sp-login-form
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
})

.directive('spEmailVerification',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spEmailVerification.tpl.html';
    },
    controller: 'SpEmailVerificationCtrl'
  };
})

/**
 * @ngdoc directive
 * @name stormpath.ifUser:if-user
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
 * @name stormpath.ifNotUser:if-not-user
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
 * @name stormpath.whileResolvingUser:while-resolving-user
 *
 * @description
 * Use this directive to show an element, while waiting to know if the user
 * is logged in or not.  This is useful if you want to show a loading graphic
 * over your application while you are waiting for the user state.
 *
 * @example
 * <pre>
 * <div while-resolving-user style="position:fixed;top:0;left:0;right:0;bottom:0;background-color:pink;">I wait for you</div>
 * </pre>
 */
.directive('whileResolvingUser',['$user',function($user){
  return {
    link: function(scope,element){
      $user.get().finally(function(){
        console.log('currentUser',$user.currentUser);
        if((typeof $user.currentUser ==='object') || ($user.currentUser===false)){
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
 * @name stormpath.logout:logout
 *
 * @description
 * This directive adds a click handler to the element.  When clicked the user will be logged out.
 *
 * @example
 * <pre>
 *   <a ui-sref="main" logout>Logout</a>
 * </pre>
 */
.directive('logout',['$auth',function($auth){
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
    return this.groups.items.filter(function(group){
      return group.name === groupName;
    }).length >0;
  };

  this.$get = [
    '$q','$http','STORMPATH_CONFIG','$rootScope',
    function userServiceFactory($q,$http,STORMPATH_CONFIG,$rootScope){
      function UserService(){
        this.cachedUserOp = null;
        this.currentUser = null;
        return this;
      }
      UserService.prototype.create = function(data){
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
         * Attemps to create a new user by posting to `/api/users`
         *
         *
         *
         * Your backend server will need to accept this request and use a
         * Stormpath SDK to create the account in the Stormpath service.  If you
         * are using the Express SDK you want to attach `register` middleware
         * to your application.
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

        var transformed = {
          surname: data.lastName,
          givenName: data.firstName,
          email: data.email,
          password: data.password
        };
        $http.post(STORMPATH_CONFIG.USER_COLLECTION_URI,transformed)
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
        else if(self.currentUser){
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
        return $http.post(STORMPATH_CONFIG.RESEND_EMAIL_VERIFICATION_ENDPOINT,data);
      };
      UserService.prototype.verify = function verify(data){
        return $http.post(STORMPATH_CONFIG.EMAIL_VERIFICATION_ENDPOINT,data);
      };
      UserService.prototype.verifyPasswordResetToken = function verifyPasswordResetToken(token){
        return $http.get(STORMPATH_CONFIG.PASSWORD_RESET_TOKEN_COLLECTION_ENDPOINT+'/'+token);
      };
      UserService.prototype.passwordResetRequest = function passwordResetRequest(data){
        return $http.post(STORMPATH_CONFIG.PASSWORD_RESET_TOKEN_COLLECTION_ENDPOINT,data);
      };
      UserService.prototype.resetPassword = function resetPassword(token,data){
        return $http.post(STORMPATH_CONFIG.PASSWORD_RESET_TOKEN_COLLECTION_ENDPOINT+'/'+token,data);
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
        userService.currentUser = null;
      });
      return userService;
    }
  ];
}]);
})(window, window.angular);