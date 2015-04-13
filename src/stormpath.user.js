'use strict';
/**
 * @ngdoc overview
 * @name stormpath.userService
 *
 * @description
 *
 * This module provides the {@link stormpath.userService.$user $user} service.
 */

/**
 * @ngdoc object
 * @name stormpath.userService.$userProvider
 *
 * @description
 *
 * Provides the {@link stormpath.userService.$user $user} service.
 *
 * Currently, this provider does not have any configuration methods.
 */

angular.module('stormpath.userService',['stormpath.CONFIG'])
.provider('$user', [function $userProvider(){

  /**
   * @ngdoc object
   * @name stormpath.userService.$user
   *
   * @description
   *
   * Use this service to get the current user and do access control checks
   * on the user.
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
         *
         * @param {Object} accountData
         *
         * An object literal for passing the data
         * for the new account.
         *
         * Required fields:
         * * `givenName` - the user's first name
         * * `surname` - the user's last name
         * * `email` - the email address of the user
         * * `password` - the password that the user wishes to use for their
         * account.  Must meet the password requirements that you have specified
         * on the directory that this account will be created in.
         *
         * @description
         *
         * Attempts to create a new user by submitting the given `accountData` as
         * JSON to `/api/users`.  The POST endpoint can be modified via the
         * {@link stormpath.config#USER_COLLECTION_URI USER_COLLECTION_URI} config option.
         *
         * This method expects a `201` response if the account does NOT require email
         * verification.
         *
         * If email verification is enabled, you should send a `202` response instead.
         *
         *  If you are using our Express.JS SDK, you can simply attach the
         *  <a href="https://github.com/stormpath/stormpath-sdk-express#register" target="_blank">`register`</a> middleware
         * to your application and these responses will be handled automatically for you.
         *
         * @returns {promise}
         *
         * A promise representing the operation to create a
         * new user.  If an error occurs (duplicate email, weak password), the
         * promise will be rejected and the http response will be passed.
         * If the operation is successful, the promise
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
         *
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
         *
         * @description
         *
         * Attempt to get the current user.  Returns a promise.  If the user
         * is authenticated, the promise will be resolved with the user object.
         * If the user is not authenticated, the promise will be rejected and
         * passed the error response from the $http service.
         *
         * If you cannot make use of the promise, you can also observe the
         * {@link $notLoggedin $notLoggedin} or {@link $currentUser $currentUser}
         * events.  They are emitted when this method has a success or failure.
         *
         * The user object is a Stormpath Account
         * object, which is wrapped by a {@link eh User} type.
         *
         * @returns {promise}
         *
         * A promise representing the operation to get the current user data
         *
         * @example
         *
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
         *
         * @description
         *
         * This event is broadcast when a call to
         * {@link stormpath.userService.$user#methods_get $user.get()}
         * results in a {@link User User} object.
         *
         * See the next section, the $notLoggeInEvent, for example usage.
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
         *
         * @description
         *
         * This event is broadcast when a call to
         * {@link stormpath.userService.$user#methods_get $user.get()}
         * results in an authentication failure.
         *
         * This event is useful for situations where you want to trigger
         * the call to get the current user, but need to respond to it
         * from some other place in your application.  An example could be,
         * during application bootstrap, you make a single call to get the current
         * user from the run function, then react to it inside your
         * application controller.
         *
         * @param {Object} event Angular event object.
         *
         * @example
         *
         * <pre>
         * var myApp = angular.module('myApp', ['stormmpath']);
         * myApp.run(function($user){
         *   //
         *   // Once our app is ready to run, trigger a call to $user.get()
         *   // We can then do other things while we wait for the result
         *   //
         *   $user.get();
         * });
         *
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
