;(function(angular) {

  angular.module('Application')
    .controller('UploadFileController', [
      '$scope', '_', 'UploadFileService',
      function($scope, _, UploadFileService) {
        // Restore state
        _.extend($scope, UploadFileService);

        $scope.onShowValidationResults = function() {
          $scope.bootstrapModal().show('validation-results');
        };

      }
    ]);

})(angular);
