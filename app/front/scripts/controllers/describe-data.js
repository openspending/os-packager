;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('DescribeDataController', [
      '$scope', 'PackageService', 'UtilsService',
      function($scope, PackageService, UtilsService) {
        $scope.resources = PackageService.getPackage().resources;
        $scope.availableDataTypes = UtilsService.getAvailableDataTypes();
        $scope.availableConcepts = UtilsService.getAvailableConcepts();
      }
    ]);

})(angular);
