;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('DescribeDataController', [
      '$scope', 'PackageService', 'UtilsService',
      function($scope, PackageService, UtilsService) {
        $scope.resources = PackageService.getPackage().resources;
        $scope.availableDataTypes = UtilsService.getAvailableDataTypes();
        $scope.availableConcepts = UtilsService.getAvailableConcepts();

        $scope.validationStatus = {
          concept: false
        };

        var validateConcepts = function() {
          $scope.validationStatus.concept = true;
          _.each($scope.resources, function(resource) {
            var amountFound = false;
            var dateTimeFound = false;
            _.each(resource.fields, function(field) {
              if (field.concept == 'mapping.measures.amount') {
                amountFound = true;
              }
              if (field.concept == 'mapping.date.properties.year') {
                dateTimeFound = true;
              }
            });
            if (!amountFound || !dateTimeFound) {
              $scope.validationStatus.concept = false;
            }
          });
        };

        $scope.onConceptChanged = function() {
          validateConcepts();
        };
      }
    ]);

})(angular);
