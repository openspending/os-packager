'use strict';

var _ = require('lodash');

angular.module('Application')
  .controller('UploadFileController', [
    '$scope', 'UploadFileService', 'ApplicationLoader',
    function($scope, UploadFileService, ApplicationLoader) {

      ApplicationLoader.then(function() {

        function reloadState() {
          $scope.state = UploadFileService.getState();

          if ($scope.state.isUrl) {
            $scope.url = $scope.state.url;
          }
          if ($scope.state.isFile) {
            $scope.file = $scope.state.file.name;
          }
          $scope.isFileSelected = $scope.state.isFile;
          $scope.isUrlSelected = $scope.state.isUrl;
        }
        reloadState();

        UploadFileService.onReset(reloadState);

        $scope.$watch('url', function(newValue, oldValue) {
          if (newValue !== oldValue) {
            $scope.resetFromCurrentStep();
            $scope.state = UploadFileService.resourceChanged(null,
              $scope.url);
            $scope.isFileSelected = false;
            $scope.isUrlSelected = !!$scope.url || $scope.state.isUrl;
          }
        });

        $scope.onFileSelected = function() {
          var file = _.first(this.files);
          $scope.file = file.name;
          $scope.resetFromCurrentStep();
          $scope.state = UploadFileService.resourceChanged(file, null);
          $scope.isFileSelected = $scope.state.isFile;
          $scope.isUrlSelected = false;
        };

        $scope.onClearSelectedResource = function() {
          $scope.file = null;
          $scope.url = null;
          $scope.isFileSelected = false;
          $scope.isUrlSelected = false;
          UploadFileService.resourceChanged(null, null);
          $scope.resetFromCurrentStep();
          $scope.state = UploadFileService.getState();
        };

        $scope.onShowValidationResults = function() {
          $scope.bootstrapModal().show('validation-results');
        };
      });
    }
  ]);
