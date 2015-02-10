/**
 * stormpath-sdk-angularjs
 * Copyright Stormpath, Inc. 2015
 * 
 * @version v0.0.2-dev-2015-02-10
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
         *     login: '',         // Expose to user as email/username field
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

'use strict';
/**
 * @ngdoc overview
 * @name stormpath
 *
 * @requires stormpath.CONFIG
 * @requires stormpath.auth
 * @requires stormpath.userService
 *
 * @description
 *
 *
 *
 * ## How to use
 *
 * This is the module that you must require in your application order to use
 * Stormpath in your Angular application.  It should be loaded after the
 * Angular library but before the creation of your application:
 *
 *
 * <pre>
 * <!doctype html>
 * <html ng-app="myApp">
 * <head>
 *   <script src="js/angular.js"></script>
 *   <!-- Include the stormpath-angular script -->
 *   <script src="js/angular-stormpath-angular.min.js"></script>
 *   <script>
 *     // ...and add 'stormpath' as a dependency
 *     var myApp = angular.module('myApp', ['stormpath']);
 *   </script>
 * </head>
 * <body>
 * </body>
 * </html>
 * </pre>
 */
angular.module('stormpath',['stormpath.CONFIG','stormpath.auth','stormpath.userService'])
.provider('$stormpath', [function $stormpathProvider(){

  this.$get = [
    '$user','$state','$cookieStore','STORMPATH_CONFIG','$rootScope',
    function stormpathServiceFactory($user,$state,$cookieStore,STORMPATH_CONFIG,$rootScope){

      function StormpathService(){
        this.postLoginState = null;
        this.postLoginParams = null;
        return this;
      }
      StormpathService.prototype.stateChangeInterceptor = function stateChangeInterceptor() {
        $rootScope.$on('$stateChangeStart', function(e,toState,toParams){
          if((toState.authenticate || toState.authorize) && ! $user.currentUser){
            e.preventDefault();
            $user.get().then(function(){
              $state.go(toState.name,toParams);
            },function(){
              return $rootScope.$broadcast('stateChangeUnauthenticated',toState,toParams);
            });

          }
          if($user.isLoggedIn && toState.authenticate && toState.authorize){
            if((Object.keys(toState.authorize).length === 1) && toState.authorize.group){
              if(!$user.currentUser.inGroup(toState.authorize.group)){
                e.preventDefault();
                return $rootScope.$broadcast('stateChangeUnauthorized',toState,toParams);
              }
            }else{
              console.error('Unknown authorize configuration for state',toState);
            }
          }
        });
      };

      return new StormpathService();
    }
  ];
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
            if(response.status===401){
              notLoggedInEvent();
            }
            self.cachedUserOp = null;
            op.reject(response);
          });
          return op.promise;
        }

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