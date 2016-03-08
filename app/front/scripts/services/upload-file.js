;(function(angular) {

  angular.module('Application')
    .factory('UploadFileService', [
      '_', 'PackageService', 'ValidationService', 'Configuration',
      'UtilsService', 'Services', 'ApplicationState', 'ApplicationLoader',
      'StepsService',
      function(_, PackageService, ValidationService, Configuration,
        UtilsService, Services, ApplicationState, ApplicationLoader,
        StepsService) {
        var utils = Services.utils;

        var result = {};

        var state = null;
        ApplicationLoader.then(function() {
          state = {};
          if (_.isObject(ApplicationState.uploadFile)) {
            state = ApplicationState.uploadFile;
          }
          ApplicationState.uploadFile = state;
        });

        var onResetCallback = null;
        result.onReset = function(cbk) {
          onResetCallback = cbk;
        }

        result.resetState = function() {
          state = {};
          ApplicationState.uploadFile = state;
          PackageService.recreatePackage();
          onResetCallback && onResetCallback();
        };

        var validateSource = function(source) {
          state.status = {
            state: 'reading'
          };

          PackageService.createResource(source)
            .then(function(resource) {
              var status = ValidationService.validateResource(resource);
              status.sampleSize = resource.data.rows.length;
              if (resource.data.headers) {
                status.sampleSize += 1;
              }
              state.status = status;

              status.$promise.then(function(data) {
                if (!status.errors) {
                  PackageService.removeAllResources();
                  if (resource) {
                    PackageService.addResource(resource);
                  }
                  return data;
                }
              });
            })
            .catch(function(error) {
              state.status = null;
              Configuration.defaultErrorHandler(error);
            });
        };

        result.getState = function() {
          return state;
        };

        result.resourceChanged = function(file, url) {
          if (utils.isUrl(url)) {
            state.isUrl = true;
            state.url = url;
            validateSource(url);
            return state;
          }
          if (_.isObject(file)) {
            state.isFile = true;
            state.file = {
              name: file.name,
              type: file.type,
              size: file.size
            };
            validateSource(file);
            return state;
          }
          state = {};
          ApplicationState.uploadFile = state;
          PackageService.recreatePackage();
          return state;
        };

        return result;
      }
    ]);

})(angular);
