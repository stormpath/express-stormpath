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
