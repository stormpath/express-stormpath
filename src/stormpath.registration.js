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
 * If you are using the email verification workflow: this form will tell the user
 * that they need to check their email to complete their registration.
 *
 * If you are NOT using the email verification workflow: you can, optionally,
 * automatically login the user and redirect them to a UI state in your application.
 * See the options below.
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