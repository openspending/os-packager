'use strict';

angular.module('Application')
  .controller('DescribeDataController', [
    '$scope', 'PackageService', 'DescribeDataService', 'ApplicationLoader',
    function($scope, PackageService, DescribeDataService, ApplicationLoader) {
      ApplicationLoader.then(function() {
        $scope.state = DescribeDataService.getState();
        $scope.resources = PackageService.getResources();

        $scope.onConceptChanged = function(field) {
          $scope.state = DescribeDataService.updateField(field);
          $scope.selectedMeasures = DescribeDataService
            .getSelectedConcepts('measure');
          $scope.selectedDimensions = DescribeDataService
            .getSelectedConcepts('dimension');
        };
      });
    }
  ]);
