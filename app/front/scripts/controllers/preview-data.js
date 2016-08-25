'use strict';

angular.module('Application')
  .controller('PreviewDataController', [
    '$scope', 'PreviewDataService', 'ApplicationLoader',
    function($scope, PreviewDataService, ApplicationLoader) {
      ApplicationLoader.then(function() {
        $scope.possibilities = PreviewDataService.getPossibilities();
        $scope.state = PreviewDataService.getState();
        //TODO: [Adam] This functionality is broken right now, we need to restore it correctly
        //$scope.previewData = PreviewDataService.getPreviewData();

        //$scope.onSelectPossibility = function(possibility) {
        //  PreviewDataService.selectPossibility(possibility);
        //  $scope.previewData = PreviewDataService.getPreviewData();
        //};
      });
    }
  ]);
