;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('UploadFileController', [
      '$scope', 'UploadFileService',
      function($scope, UploadFileService) {
        // Restore state
        _.extend($scope, UploadFileService);

        $scope.onShowValidationResults = function() {
          $scope.bootstrapModal().show('validation-results');
        };

      }
    ]);

})(angular);
