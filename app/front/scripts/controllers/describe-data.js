;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('DescribeDataController', [
      '$scope', 'PackageService', 'UtilsService', 'ValidationService',
      function($scope, PackageService, UtilsService, ValidationService) {
        $scope.resources = PackageService.getPackage().resources;

        $scope.availableCurrencies = UtilsService.getAvailableCurrencies();

        $scope.validationStatus = {
          concept: false
        };

        $scope.onAdditionalPropertyChanged = function(field) {
          if (!field) {
            return;
          }
          $scope.validationStatus.concept =
            ValidationService.validateResourcesConcepts($scope.resources);
        };

        $scope.onConceptChanged = function(field) {
          if (!field) {
            return;
          }
          if (field.concept) {
            var concept = UtilsService.findConcept(field.concept);
            field.type = _.first(_.intersection(concept.allowedTypes,
              _.pluck(field.allowedTypes, 'id')));
          } else {
            field.type = field.inferredType;
          }
          $scope.validationStatus.concept =
            ValidationService.validateResourcesConcepts($scope.resources);
        };
      }
    ]);

})(angular);
