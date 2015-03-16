'use strict';

describe('Controller: PasswordResetRequestCtrl', function () {

  // load the controller's module
  beforeEach(module('dashboardAppApp'));

  var PasswordResetRequestCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PasswordResetRequestCtrl = $controller('PasswordResetRequestCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
