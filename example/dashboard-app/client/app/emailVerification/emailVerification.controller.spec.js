'use strict';

describe('Controller: EmailVerificationCtrl', function () {

  // load the controller's module
  beforeEach(module('dashboardAppApp'));

  var EmailVerificationCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EmailVerificationCtrl = $controller('EmailVerificationCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
