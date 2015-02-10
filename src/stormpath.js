'use strict';
/**
 * @ngdoc overview
 * @name stormpath
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
 *   <!-- Include the Stormpath AngularJS SDK -->
 *   <script src="js/stormpath-sdk-angularjs.min.js"></script>
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