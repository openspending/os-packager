;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('UploadFileService', [
      '$rootScope', '$timeout', 'PackageService', 'ValidationService',
      'Configuration', 'UtilsService', 'StepsService',
      function($rootScope, $timeout, PackageService, ValidationService,
        Configuration, UtilsService, StepsService) {
        var result = {};

        var $scope = $rootScope.$new();
        result.scope = $scope;

        $scope.$step = StepsService.getStepById('upload-file');

        // Initialize scope variables
        result.reset = function() {
          $scope.step.isPassed = false;
          $scope.file = null;
          $scope.url = null;
          $scope.validationStatus = null;
          $scope.resource = null;
        };
        result.reset();

        result.onClearSelectedFile = function() {
          $scope.file = null;
          $scope.validationStatus = null;
        };

        result.onClearSelectedUrl = function() {
          $scope.url = null;
          $scope.validationStatus = null;
        };

        result.onFileSelected = function() {
          $scope.file = _.first(this.files);
        };

        var validateSource = function() {
          if (!$scope.file && !$scope.url) {
            $scope.validationStatus = null;
            return;
          }

          $scope.validationStatus = {
            state: 'reading'
          };

          PackageService.createResource($scope.file ||
          UtilsService.decorateProxyUrl($scope.url))
            .then(function(resource) {
              $scope.resource = resource;
              $scope.validationStatus = ValidationService
                .validateResource(resource);

              $scope.validationStatus.$promise.then(function(data) {
                if (!$scope.validationStatus.errors) {
                  var dataPackage = PackageService.getPackage();
                  dataPackage.resources.clear();
                  if ($scope.resource) {
                    dataPackage.resources.add($scope.resource);
                  }
                  return data;
                }
              });
            })
            .catch(function(error) {
              $scope.validationStatus = null;
              Configuration.defaultErrorHandler(error);
            });
        };
        var validateSourceDelayed = _.debounce(function() {
          $timeout(validateSource);
        }, 500);

        $scope.$watch('file', function() {
          if (!$scope.file && !$scope.url) {
            $scope.validationStatus = null;
            return;
          }
          validateSource();
        });
        $scope.$watch('url', function() {
          if (!$scope.file && !$scope.url) {
            $scope.validationStatus = null;
            return;
          }
          validateSourceDelayed();
        });

        return result;
      }
    ]);

})(angular);
