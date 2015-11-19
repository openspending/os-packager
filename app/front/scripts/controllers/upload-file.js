;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('UploadFileController', [
      '$scope', 'PackageService', 'ValidationService', 'Configuration',
      function($scope, PackageService, ValidationService, Configuration) {
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
            return;
          }

          $scope.validationStatus = {
            inProgress: true
          };

          PackageService.createResource($scope.file || $scope.url)
            .then(function(resource) {
              $scope.resource = resource;
              $scope.validationStatus = ValidationService
                .validateResource(resource);
            })
            .catch(function(error) {
              $scope.validationStatus = null;
              Configuration.defaultErrorHandler(error);
            });
        };

        $scope.$watch('file', validateSource);
        $scope.$watch('url', _.debounce(validateSource, 500));

        $scope.goToNextStep = function() {
          var dataPackage = PackageService.getPackage();
          dataPackage.resources.clear();
          dataPackage.resources.add($scope.resource);
          $scope.$parent.goToNextStep();
        };
      }
    ]);

})(angular);
