;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('DownloadPackageService', [
      '$rootScope', 'PackageService', 'StepsService',
      function($rootScope, PackageService, StepsService) {
        var result = {};

        var $scope = $rootScope.$new();
        result.scope = $scope;

        $scope.$step = StepsService.getStepById('download');
        $scope.$step.reset = function() {
          result.reset();
        };

        var generateMappings = function(fiscalDataPackage) {
          var result = [];

          var getResource = function(name) {
            if (!!name) {
              return _.find(fiscalDataPackage.resources, function(resource) {
                return resource.name == name;
              });
            }
            return _.first(fiscalDataPackage.resources);
          };

          // Measures
          _.each(fiscalDataPackage.mapping.measures, function(mapping, name) {
            var resource = getResource(mapping.resource);
            result.push({
              name: name,
              sources: [{
                fileName: resource.title || resource.name,
                fieldName: mapping.source
              }]
            });
          });

          // Dimensions
          _.each(fiscalDataPackage.mapping.dimensions,
            function(dimension, name) {
              var sources = [];
              _.each(dimension.attributes, function(mapping) {
                var resource = getResource(mapping.resource);
                sources.push({
                  fileName: resource.title || resource.name,
                  fieldName: mapping.source
                });
              });
              result.push({
                name: name,
                sources: sources
              });
            });

          return result;
        };

        // Initialize scope variables
        result.reset = function() {
          $scope.$step.isPassed = false;
          $scope.fileName = 'datapackage.json';
          $scope.attributes = PackageService.getAttributes();
          $scope.resources = PackageService.getResources();
          $scope.fiscalDataPackage = PackageService.createFiscalDataPackage();
          $scope.mappings = generateMappings($scope.fiscalDataPackage);
        };
        result.reset();

        return result;
      }
    ]);

})(angular);
