'use strict';

describe('Controller: PasswordResetCtrl', function () {

  // load the controller's module
  beforeEach(module('dashboardAppApp'));

  var PasswordResetCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PasswordResetCtrl = $controller('PasswordResetCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
