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
