;(function(angular) {

  angular.module('Application')
    .controller('UploadFileController', [
      '$scope', '_', 'UploadFileService', 'ApplicationLoader',
      function($scope, _, UploadFileService, ApplicationLoader) {
        ApplicationLoader.then(function() {
          $scope.state = UploadFileService.getState();

          if ($scope.state.isUrl) {
            $scope.url = $scope.state.url;
          }
          if ($scope.state.isFile) {
            $scope.file = $scope.state.file.name;
          }
          $scope.isFileSelected = $scope.state.isFile;
          $scope.isUrlSelected = $scope.state.isUrl;

          $scope.$watch('url', function(newValue, oldValue) {
            if (newValue !== oldValue) {
              $scope.state = UploadFileService.resourceChanged(null, $scope.url);
              $scope.isFileSelected = false;
              $scope.isUrlSelected = !!$scope.url || $scope.state.isUrl;
            }
          });

          $scope.onFileSelected = function() {
            var file = _.first(this.files);
            $scope.file = file.name;
            $scope.state = UploadFileService.resourceChanged(file, null);
            $scope.isFileSelected = $scope.state.isFile;
            $scope.isUrlSelected = false;
          };

          $scope.onClearSelectedResource = function() {
            $scope.file = null;
            $scope.url = null;
            $scope.isFileSelected = false;
            $scope.isUrlSelected = false;
            $scope.state = UploadFileService.resourceChanged(null, null);
            $scope.resetFromCurrentStep();
          };

          $scope.onShowValidationResults = function() {
            $scope.bootstrapModal().show('validation-results');
          };
        });
      }
    ]);

})(angular);
