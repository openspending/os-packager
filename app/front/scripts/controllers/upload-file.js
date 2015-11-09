;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('UploadFileController', [
      '$scope', 'PackageService', 'Configuration',
      function($scope, PackageService, Configuration) {
        $scope.file = null;
        $scope.url = null;

        $scope.validationStatus = {
          inProgress: false,
          completed: false,
          errors: null
        };

        $scope.resource = null;

        $scope.onClearSelectedFile = function() {
          $scope.file = null;
          $scope.validationStatus.inProgress = false;
          $scope.validationStatus.completed = false;
        };

        $scope.onClearSelectedUrl = function() {
          $scope.url = null;
          $scope.validationStatus.inProgress = false;
          $scope.validationStatus.completed = false;
        };

        $scope.onShowValidationResults = function() {
          $scope.bootstrapModal().show('validation-results');
        };

        $scope.onFileSelected = function() {
          $scope.file = _.first(this.files);
        };

        var validateSource = function(value) {
          if (!$scope.file && !$scope.url) {
            return;
          }

          $scope.validationStatus.completed = false;
          $scope.validationStatus.inProgress = true;
          $scope.validationStatus.errors = null;

          PackageService.createResource($scope.file || $scope.url)
            .then(function(resource) {
              // Value will be either file object or url that triggered this
              // handler. It may change while processing validation stuff,
              // so check it. If current file/url is not 'our' file/url -
              // just ignore results. Same for catch() and finally()
              if ((value != $scope.file) && (!value !== $scope.url)) {
                return;
              }

              $scope.resource = resource;
              if (
                resource.validationResults &&
                resource.validationResults.length
              ) {
                $scope.validationStatus.errors = resource.validationResults;
              }

              return resource;
            })
            .catch(function(error) {
              if ((value != $scope.file) && (!value !== $scope.url)) {
                return;
              }
              Configuration.defaultErrorHandler(error);
            })
            .finally(function() {
              if ((value != $scope.file) && (!value !== $scope.url)) {
                return;
              }
              $scope.validationStatus.inProgress = false;
              $scope.validationStatus.completed = true;
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
