;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('UploadFileController', [
      '$scope', 'PackageService',
      function($scope, PackageService) {
        $scope.file = null;
        $scope.url = null;

        $scope.sourceIsValid = false;

        $scope.processingMessage = null;

        $scope.onClearSelectedFile = function() {
          $scope.file = null;
        };

        $scope.onFileSelected = function() {
          $scope.file = _.first(this.files);
        };

        $scope.validateSource = function() {
          $scope.errors = null;
          $scope.processingMessage = 'Processing file...';

          PackageService.addResource($scope.file || $scope.url)
            .then(function(results) {
              $scope.sourceIsValid = !results || results.length == 0;
              $scope.errors = results;
            })
            .catch(function(error) {
              console.trace(error);
            })
            .finally(function() {
              $scope.processingMessage = null;
              $scope.bootstrapModal().show('validation-results');
            });
        };
      }
    ]);

})(angular);
