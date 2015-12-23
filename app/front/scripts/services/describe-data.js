;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('DescribeDataService', [
      '$rootScope', 'PackageService', 'UtilsService', 'ValidationService',
      'StepsService',
      function($rootScope, PackageService, UtilsService, ValidationService,
        StepsService) {
        var result = {};

        var $scope = $rootScope.$new();
        result.scope = $scope;

        $scope.$step = StepsService.getStepById('describe-data');
        $scope.$step.reset = function() {
          result.reset();
        };

        // Initialize scope variables
        result.reset = function() {
          $scope.$step.isPassed = false;
          $scope.resources = PackageService.getResources();
          $scope.validationStatus = {
            concept: false
          };
        };
        result.reset();

        result.onAdditionalPropertyChanged = function(field) {
          if (!field) {
            return;
          }
          $scope.validationStatus.concept =
            ValidationService.validateResourcesConcepts($scope.resources);
        };

        result.onConceptChanged = function(field) {
          if (!field) {
            return;
          }
          if (field.concept) {
            var concept = UtilsService.findConcept(field.concept);
            field.additionalOptions = concept.options;
            field.options = _.object(_.map(concept.options, function(item) {
              return [item.name, item.defaultValue];
            }));
            field.type = _.first(_.intersection(concept.allowedTypes,
              _.pluck(field.allowedTypes, 'id')));
          } else {
            field.type = field.inferredType;
            field.options = {};
          }
          $scope.validationStatus.concept =
            ValidationService.validateResourcesConcepts($scope.resources);
        };

        return result;
      }
    ]);

})(angular);
