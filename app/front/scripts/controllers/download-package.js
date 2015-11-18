;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('DownloadPackageController', [
      '$scope', 'PackageService',
      function($scope, PackageService) {
        $scope.fileName = 'datapackage.json';
        $scope.dataPackage = PackageService.getPackage();
        $scope.fiscalDataPackage = PackageService.createFiscalDataPackage();

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
              _.each(dimension.fields, function(mapping) {
                var resource = getResource(mapping.resource);
                result.push({
                  name: name,
                  sources: [{
                    fileName: resource.title || resource.name,
                    fieldName: mapping.source
                  }]
                });
              });
            });

          return result;
        };

        $scope.mappings = generateMappings($scope.fiscalDataPackage);
      }
    ]);

})(angular);
