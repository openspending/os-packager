'use strict';

angular.module('Application')
  .controller('DescribeDataController', [
    '$scope', 'PackageService', 'DescribeDataService', 'ApplicationLoader',
    function($scope, PackageService, DescribeDataService, ApplicationLoader) {
      ApplicationLoader.then(function() {
        $scope.state = DescribeDataService.getState();
        $scope.resources = PackageService.getResources();

        DescribeDataService.updateField()
          .then(function(state) {
            $scope.state = state;
            $scope.$apply();
          });
        $scope.selectedMeasures = DescribeDataService
          .getSelectedConcepts('measure');
        $scope.selectedDimensions = DescribeDataService
          .getSelectedConcepts('dimension');

        $scope.onConceptChanged = function(field) {
          DescribeDataService.updateField(field)
            .then(function(state) {
              $scope.state = state;
              $scope.$apply();
            });
          $scope.selectedMeasures = DescribeDataService
            .getSelectedConcepts('measure');
          $scope.selectedDimensions = DescribeDataService
            .getSelectedConcepts('dimension');
        };
      });
    }
  ]);
