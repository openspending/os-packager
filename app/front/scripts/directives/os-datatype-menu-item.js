'use strict';

var templateUrl = 'templates/directives/os-datatype-menu-item.html';

angular.module('Application')
  .directive('osDatatypeMenuItem', [
    function() {
      return {
        restrict: 'A',
        templateUrl: templateUrl,
        replace: false,
        scope: {
          item: '<',
          onClick: '&',
        },
        link: function($scope, element, attr, ctrl) {
          $scope.templateUrl = templateUrl;
        },
      };
    }
  ]);
