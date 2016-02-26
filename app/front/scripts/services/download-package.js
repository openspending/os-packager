;(function(angular) {

  angular.module('Application')
    .factory('DownloadPackageService', [
      '$q', '_', 'PackageService', 'ApplicationState', 'ApplicationLoader',
      'StepsService', 'StorageService',
      function($q, _, PackageService, ApplicationState, ApplicationLoader,
        StepsService, StorageService) {
        var result = {};

        var state = null;
        ApplicationLoader.then(function() {
          state = {};
          if (_.isObject(ApplicationState.downloadPackage)) {
            state = ApplicationState.downloadPackage;
          }
          ApplicationState.downloadPackage = state;
        });

        result.resetState = function() {
          state = {};
          ApplicationState.downloadPackage = state;
        };

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
          _.each(fiscalDataPackage.model.measures, function(measure, name) {
            var resource = getResource(measure.resource);
            result.push({
              name: name,
              sources: [{
                fileName: resource.title || resource.name,
                fieldName: measure.source
              }]
            });
          });

          // Dimensions
          _.each(fiscalDataPackage.model.dimensions,
            function(dimension, name) {
              var sources = [];
              _.each(dimension.attributes, function(dimension) {
                var resource = getResource(dimension.resource);
                sources.push({
                  fileName: resource.title || resource.name,
                  fieldName: dimension.source
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
              StorageService.clearApplicationState()
                  .then(function() {
                    var packageName = PackageService.getAttributes().name;
                    state.packagePublicUrl = '/viewer/'+packageName; //dataPackage.uploadUrl;
                  });
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
