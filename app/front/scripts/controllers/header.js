'use strict';

angular.module('Application')
  .controller('HeaderController', [
    '$scope', 'LoginService',
    function($scope, LoginService) {
      $scope.login = LoginService;
    }
  ]);
