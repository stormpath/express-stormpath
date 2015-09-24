'use strict';
/**
 * @ngdoc overview
 *
 * @name stormpath.userService
 *
 * @description
 *
 * This module provides the {@link stormpath.userService.$user $user} service.
 */

/**
 * @ngdoc object
 *
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
   *
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
  /**
  * This method may change in the future, do not use.
  * Please use the `ifUserInGroup` directive instead
  */
  User.prototype.inGroup = function inGroup(groupName) {
    return this.groups.filter(function(group){
      return group.name === groupName;
    }).length >0;
  };
  /**
  * This method may change in the future, do not use.
  * Please use the `ifUserInGroup` directive instead
  */
  User.prototype.matchesGroupExpression = function matchesGroupExpression(regex) {
    return this.groups.filter(function(group){
      return regex.test(group.name);
    }).length >0;
  };
  /**
  * This method may change in the future, do not use.
  * Please use the `ifUserInGroup` directive instead
  */
  User.prototype.groupTest = function groupTest(expr) {
    if(expr instanceof RegExp && this.matchesGroupExpression(expr)){
      return true;
    }else if(this.inGroup(expr)){
      return true;
    }else{
      return false;
    }
  };

  this.$get = [
    '$q','$http','STORMPATH_CONFIG','$rootScope','$spFormEncoder',
    function userServiceFactory($q,$http,STORMPATH_CONFIG,$rootScope,$spFormEncoder){
      function UserService(){
        this.cachedUserOp = null;

        /**
          * @ngdoc property
          *
          * @name currentUser
          *
          * @propertyOf stormpath.userService.$user
          *
          * @description
          *
          * Retains the account object of the currently logged in user.
          *
          * If the user state is unknown, this value is `null`.
          *
          * If the user state is known and the user is not logged in
          * ({@link stormpath.userService.$user#methods_get $user.get()} has
          * been called, and rejected) then this value will be `false`.
          *
          */

        this.currentUser = null;
        return this;
      }
      UserService.prototype.create = function(accountData){
        /**
         * @ngdoc function
         *
         * @name create
         *
         * @methodOf stormpath.userService.$user
         *
         * @param {Object} accountData
         *
         * An object literal for passing the data
         * to the new account.
         *
         * Required fields:
         * * `givenName` - the user's first name
         * * `surname` - the user's last name
         * * `email` - the email address of the user
         * * `password` - the password that the user wishes to use for their
         * account.  Must meet the password requirements that you have specified
         * on the directory that this account will be created in.
         *
         * @returns {promise}
         *
         * A promise representing the operation to create a
         * new user.  If an error occurs (duplicate email, weak password), the
         * promise will be rejected and the http response will be passed.
         * If the operation is successful, the promise
         * will be resolved with a boolean `enabled` value.
         *
         * * If `true`, the account's status is Enabled and you can proceed with authenticating the user.
         *
         * * If `false`, the account's status is Unverified.
         * This will be the case when you have enabled the email verification workflow on the directory of this
         * account.
         *
         * @description
         *
         * Attempts to create a new user by submitting the given `accountData` as
         * JSON to `/register`.  The POST endpoint can be modified via the
         * {@link api/stormpath.STORMPATH_CONFIG:STORMPATH_CONFIG#properties_REGISTER_URI REGISTER_URI}
         * config option.
         *
         * @example
         *
         * <pre>
         * $user.create(accountData)
         *   .then(function(account){
         *     if(account.status === 'ENABLED'){
         *       // The account is enabled and ready to use
         *     }else if(account.status === 'UNVERIFIED'){
         *       // The account requires email verification
         *     }
         *   })
         *   .catch(function(response){
         *     // Show the error message to the user
         *     $scope.error = response.data.error;
         *   });
         * </pre>
         */
        var op = $q.defer();

        $http($spFormEncoder.formPost({
          url: STORMPATH_CONFIG.getUrl('REGISTER_URI'),
          method: 'POST',
          data: accountData
        }))
        .then(function(response){
          op.resolve(response.data);
          registeredEvent(response.data);
        },op.reject);

        return op.promise;
      };
      UserService.prototype.get = function get() {
        /**
         * @ngdoc function
         *
         * @name get
         *
         * @methodOf stormpath.userService.$user
         *
         * @returns {promise}
         *
         * A promise representing the operation to get the current user data.
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
         * @example
         *
         * <pre>
         * var myApp = angular.module('myApp', ['stormpath']);
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

          $http.get(STORMPATH_CONFIG.getUrl('CURRENT_USER_URI'),{withCredentials:true}).then(function(response){
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

      /**
       * @ngdoc function
       *
       * @name resendVerificationEmail
       *
       * @methodOf stormpath.userService.$user
       *
       * @returns {promise}
       *
       * An $http promise representing the operation to resend a verification token
       * to the given email address.  Will resolve, even if the email address
       * does not exist.  If rejected there was a network error.
       *
       * @description
       *
       * Re-sends the verification email to the account specified by the
       * username or email address.
       *
       * @param  {Object} data
       *
       * An object literal for passing the username or email.
       * ```
       * {
       *   username: 'email address or username'
       * }
       * ```
       */
      UserService.prototype.resendVerificationEmail = function resendVerificationEmail(data){
        return $http({
          method: 'POST',
          url: STORMPATH_CONFIG.getUrl('EMAIL_VERIFICATION_ENDPOINT'),
          data: data
        });
      };

      /**
       * @ngdoc function
       *
       * @name verify
       *
       * @methodOf stormpath.userService.$user
       *
       * @returns {promise}
       *
       * An $http promise representing the operation to verify the given
       * email verification token token.  If resolved the account has been
       * verified and can be used for login.  If rejected the token is expired
       * or has already been used.
       *
       * @param  {Object} data Data object
       *
       * An object literal for passing the email verification token.
       * Must follow this format:
       * ```
       * {
       *   sptoken: '<token from email>'
       * }```
       *
       * @description
       *
       * Verifies a new account, using the `sptoken` that was sent to the user
       * by email.
       */
      UserService.prototype.verify = function verify(token){
        return $http({
          url: STORMPATH_CONFIG.getUrl('EMAIL_VERIFICATION_ENDPOINT') + '?sptoken='+token
        });
      };

      /**
       * @ngdoc function
       *
       * @name verifyPasswordResetToken
       *
       * @methodOf stormpath.userService.$user
       *
       * @returns {promise}
       *
       * A $http promise representing the operation to verify the given password
       * reset token token.  If resolved, the token can be used.  If rejected
       * the token cannot be used.
       *
       * @description
       *
       * Verifies a password reset token that was sent to the user by email.
       * If valid, the token can be used to reset the user's password.  If not
       * valid it means that the token has expired or has already been used.
       *
       * Use this method to verify the token, before asking the user to specify
       * a new password.  If the token is invalid the user must ask for another.
       *
       * @param  {String} sptoken
       *
       * The `sptoken` that was delivered to the user by email
       */
      UserService.prototype.verifyPasswordResetToken = function verifyPasswordResetToken(token){
        return $http.get(STORMPATH_CONFIG.getUrl('CHANGE_PASSWORD_ENDPOINT')+'?sptoken='+token);
      };

      /**
       * @ngdoc function
       *
       * @name passwordResetRequest
       *
       * @methodOf stormpath.userService.$user
       *
       * @returns {promise}
       *
       * An $http promise representing the operation to generate a password
       * reset token for the given email address.  Will resolve, even if the
       * email address does not exist.  If rejected there was a network error.
       *
       * @description
       *
       * Triggers a password reset email to the given username or email address.
       *
       * @param  {Object} data
       *
       * An object literal for passing the username or email.
       * ```
       * {
       *   username: 'email address or username'
       * }
       * ```
       */
      UserService.prototype.passwordResetRequest = function passwordResetRequest(data){
        return $http($spFormEncoder.formPost({
          method: 'POST',
          url: STORMPATH_CONFIG.getUrl('FORGOT_PASSWORD_ENDPOINT'),
          data: data
        }));
      };

      /**
       * @ngdoc function
       *
       * @name resetPassword
       *
       * @methodOf stormpath.userService.$user
       *
       * @returns {promise}
       *
       * An $http promise representing the operation to reset the password and
       * consume the token.  If resolved the password was successfully changed,
       * if rejected the token is invalid or the posted password does not meet
       * the password strength rules of the directory.
       *
       * @description
       *
       * Resets a user's password, using a token that was emailed to the user.
       *
       * @param {String} token
       *
       * The `sptoken` that was sent to the user via email.
       *
       * @param  {Object} data
       *
       * An object literal for passing the new password.  Must follow this
       * format:
       * ```
       * {
       *   password: 'the new password'
       * }
       * ```
       */
      UserService.prototype.resetPassword = function resetPassword(token,data){
        data.sptoken = token;
        return $http($spFormEncoder.formPost({
          method: 'POST',
          url:STORMPATH_CONFIG.getUrl('CHANGE_PASSWORD_ENDPOINT'),
          data: data
        }));
      };
      function registeredEvent(account){
        /**
         * @ngdoc event
         *
         * @name stormpath.userService.$user#$registered
         *
         * @eventOf stormpath.userService.$user
         *
         * @eventType broadcast on root scope
         *
         * @param {Object} event
         *
         * Angular event object.
         *
         * @param {account} account
         *
         * The object of the account that was created.
         *
         * @description
         *
         * This event is broadcast when a call to
         * {@link stormpath.userService.$user#methods_create $user.create()}
         * is successful.  The account object is returned, and you can inspec
         * the account's status to know if email verification is required.
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.REGISTERED_EVENT_NAME,account);
      }
      function currentUserEvent(user){
        /**
         * @ngdoc event
         *
         * @name stormpath.userService.$user#$currentUser
         *
         * @eventOf stormpath.userService.$user
         *
         * @eventType broadcast on root scope
         *
         * @param {Object} event
         *
         * Angular event object.
         *
         * @param {User} user
         *
         * The current user object.
         *
         * @description
         *
         * This event is broadcast when a call to
         * {@link stormpath.userService.$user#methods_get $user.get()}
         * and provides the user object as the second parameter.
         *
         * See the next section, the $notLoggeInEvent, for example usage.
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.GET_USER_EVENT,user);
      }
      function notLoggedInEvent(){
        /**
         * @ngdoc event
         *
         * @name stormpath.userService.$user#$notLoggedIn
         *
         * @eventOf stormpath.userService.$user
         *
         * @eventType broadcast on root scope
         *
         * @param {Object} event
         *
         * Angular event object.
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
         * @example
         *
         * <pre>
         * var myApp = angular.module('myApp', ['stormpath']);
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
