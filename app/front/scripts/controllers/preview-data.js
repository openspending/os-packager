;(function(angular) {

  angular.module('Application')
    .controller('PreviewDataController', [
      '$scope', 'PreviewDataService', 'ApplicationLoader',
      function($scope, PreviewDataService, ApplicationLoader) {
        ApplicationLoader.then(function() {
          $scope.possibilities = PreviewDataService.getPossibilities();
          $scope.state = PreviewDataService.getState();
          $scope.previewData = PreviewDataService.getPreviewData();

          $scope.onSelectPossibility = function(possibility) {
            PreviewDataService.selectPossibility(possibility);
            $scope.previewData = PreviewDataService.getPreviewData();
          };
        });
      }
    ]);

})(angular);
