;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('DescribeDataController', [
      '$scope', 'PackageService', 'UtilsService',
      function($scope, PackageService, UtilsService) {
        $scope.schema = PackageService.getSchema();
        $scope.data = PackageService.getData();
        $scope.mapping = PackageService.getMapping();
        $scope.availableDataTypes = UtilsService.getAvailableDataTypes();
        $scope.availableConcepts = UtilsService.getAvailableConcepts();
      }
    ]);

})(angular);
