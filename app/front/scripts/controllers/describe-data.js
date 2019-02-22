'use strict';

angular.module('Application')
  .controller('DescribeDataController', [
    '$scope', 'PackageService', 'DescribeDataService', 'ApplicationLoader',
    function($scope, PackageService, DescribeDataService, ApplicationLoader) {
      $scope.schema = {
        file: null
      };

      ApplicationLoader.then(function() {
        $scope.state = DescribeDataService.getState();
        $scope.resources = PackageService.getResources();

        DescribeDataService.updateField()
          .then(function(state) {
            $scope.state = state;
            $scope.$apply();
          });

        // $scope.onGetResourceButtonClick = function() {
        //   console.log(PackageService.getResources());
        // };

        $scope.onFileSelected = function($fileContent) {
          DescribeDataService.schemaChanged($fileContent)
            .then(function() {
              $scope.$apply(function() {
                $scope.state = DescribeDataService.getState();
                $scope.resources = PackageService.getResources();
              });
            });
        };

        $scope.onClearSelectedResource = function() {
          $scope.schema.file = null;
          $scope.isFileSelected = false;
          // UploadFileService.resourceChanged(null, null);
          $scope.resetFromCurrentStep();
          // $scope.state = UploadFileService.getState();
        };

        $scope.onConceptChanged = function(field) {
          DescribeDataService.updateField(field)
            .then(function(state) {
              $scope.state = state;
              $scope.$apply();
            });
        };
      });
    }
  ]);
