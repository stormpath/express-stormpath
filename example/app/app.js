'use strict';

angular.module('stormpathAngularDemo', [
  'ui.router',
  'stormpath'
]).config(function ($stateProvider,$urlRouterProvider) {
    $stateProvider.state('home', {
      url: '/',
      templateUrl: 'home.html'
    });
    $stateProvider.state('login', {
      url: '/login',
      templateUrl: 'login.html'
    });
    $stateProvider.state('dashboard', {
      url: '/dashboard',
      templateUrl: 'dashboard.html',
      controller: 'DashboardCtrl',
      resolve: {
        resolvedUser: function($user,$state){
          var promise = $user.get().catch(function(){
            /*
              If the promise is rejected it meants that the
              user is not logged in and we should send them to
              the login page
            */
            $state.go('login');
          });
          return promise;
        }
      }
    });
    $urlRouterProvider.otherwise('/');
  })
  .controller('MenuCtrl',function($scope,$rootScope,$auth,$state){
    /*
      This is an example of manually maintaining a local scope
      object, called user, which reflects the state of the
      currently logged in user.  When $curretUser fires we
      know that the user is logged in.  When $sessionEnd fires
      we know that the user has logged out
     */
    $rootScope.$on('$currentUser',function(user){
      $scope.user = user;
    });
    $rootScope.$on('$sessionEnd',function(){
      $scope.user = null;
    });
    $scope.logout = function(){
      $auth.endSession().then(function(){
        $state.go('home');
      });
    };
  })
  .controller('DashboardCtrl',function($scope,resolvedUser){
    /*
      This is an example of using "resolves" from ui-router.
      If the user is not logged in, the state transition will
      not happen.  If the user is logged in the state transition
      will happen and this controller will be constructued AFTER
      the current user is returned by the user service
     */
    $scope.user = resolvedUser;
  })
  .controller('LoginFormCtrl', function ($scope, $auth, $state) {
    $scope.errorMessage = null;
    $scope.formModel = {
      username: '',
      password: ''
    };

    $scope.submit = function submit() {
      $scope.errorMessage = null;
      $scope.posting = true;
      $auth.authenticate($scope.formModel)
        .then(function(){
          $state.go('dashboard');
          $scope.posting = false;
        })
        .catch(function(response){
          $scope.errorMessage = response.data.errorMessage;
          $scope.posting = false;
        });
    };
  });