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

        var getSelectedConcepts = function(group) {
          var mapped = [];
          _.each($scope.resources, function(resource) {
            _.each(resource.fields, function(field) {
              var concept = UtilsService.findConcept(field.concept);
              if (concept && concept.group == group) {
                field = _.clone(field);
                field.concept = concept;
                field.options = _.chain(field.options)
                  .map(function(value, key) {
                    var option = _.findWhere(concept.options, {name: key});
                    if (option.values) {
                      var temp = _.findWhere(option.values, {value: value});
                      if (_.isObject(temp)) {
                        value = temp.name;
                      }
                    }
                    var isEmptyValue = _.isUndefined(value) ||
                      _.isNull(value) || (value == '');
                    if (isEmptyValue) {
                      return false;
                    }
                    return {
                      name: option.title,
                      value: value
                    };
                  })
                  .filter()
                  .value();
                mapped.push(field);
              }
            });
          });
          return mapped;
        };

        result.onAdditionalPropertyChanged = function(field) {
          if (!field) {
            return;
          }
          $scope.validationStatus.concept =
            ValidationService.validateResourcesConcepts($scope.resources);
          $scope.selectedMeasures = getSelectedConcepts('measure');
          $scope.selectedDimensions = getSelectedConcepts('dimension');
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
          $scope.selectedMeasures = getSelectedConcepts('measure');
          $scope.selectedDimensions = getSelectedConcepts('dimension');
        };

        return result;
      }
    ]);

})(angular);
