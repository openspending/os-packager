;(function(angular, _) {

  angular.module('Application')
    .controller('UploadFileController', [
      '$scope', '$timeout',
      function($scope, $timeout) {
        $scope.file = null;
        $scope.url = null;

        $scope.onClearSelectedFile = function() {
          $scope.file = null;
        };

        $scope.onFileSelected = function() {
          $scope.file = _.first(this.files);
        }
      }
    ]);

})(angular, _);
