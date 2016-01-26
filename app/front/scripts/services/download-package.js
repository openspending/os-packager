;(function(angular) {

  angular.module('Application')
    .factory('DownloadPackageService', [
      '$q', '_', 'PackageService', 'ApplicationState', 'ApplicationLoader',
      function($q, _, PackageService, ApplicationState, ApplicationLoader ) {
        var result = {};

        var state = null;
        ApplicationLoader.then(function() {
          state = {};
          if (_.isObject(ApplicationState.downloadPackage)) {
            state = ApplicationState.downloadPackage;
          }
          ApplicationState.downloadPackage = state;
        });

        result.getState = function() {
          return state;
        };

        result.generateMappings = function(fiscalDataPackage) {
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

        result.publishDataPackage = function() {
          state.packagePublicUrl = null;
          state.isUploading = true;
          var files = PackageService.publish();
          state.uploads = files;
          files.$promise
            .then(function(dataPackage) {
              state.packagePublicUrl = dataPackage.uploadUrl;
              state.uploads = null;
            })
            .finally(function() {
              state.isUploading = false;
            });
          return state;
        };

        return result;
      }
    ]);

})(angular);
