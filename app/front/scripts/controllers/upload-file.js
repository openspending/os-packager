;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('UploadFileController', [
      '$scope', '$timeout', 'PackageService', 'ValidationService',
      'Configuration', 'UtilsService',
      function($scope, $timeout, PackageService, ValidationService,
        Configuration, UtilsService) {
        $scope.file = null;
        $scope.url = null;

        $scope.validationStatus = null;

        $scope.resource = null;

        $scope.onClearSelectedFile = function() {
          $scope.file = null;
          $scope.validationStatus = null;
        };

        $scope.onClearSelectedUrl = function() {
          $scope.url = null;
          $scope.validationStatus = null;
        };

        $scope.onShowValidationResults = function() {
          $scope.bootstrapModal().show('validation-results');
        };

        $scope.onFileSelected = function() {
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
      }
    ]);

})(angular);
