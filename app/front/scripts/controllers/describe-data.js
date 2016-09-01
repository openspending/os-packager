'use strict';

var _ = require('lodash');

angular.module('Application')
  .controller('DescribeDataController', [
    '$scope', 'PackageService', 'DescribeDataService', 'ApplicationLoader',
    function($scope, PackageService, DescribeDataService, ApplicationLoader) {
      ApplicationLoader.then(function() {
        $scope.state = DescribeDataService.getState();
        $scope.resources = PackageService.getResources();

        _.each($scope.resources, function(resource) {
          _.each(resource.fields, function(field) {
            $scope.state = DescribeDataService.updateField(field);
          });
        });
        $scope.selectedMeasures = DescribeDataService
          .getSelectedConcepts('measure');
        $scope.selectedDimensions = DescribeDataService
          .getSelectedConcepts('dimension');

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
