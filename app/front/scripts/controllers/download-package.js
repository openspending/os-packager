;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('DownloadPackageController', [
      '$scope', 'DownloadPackageService', 'StepsService',
      function($scope, DownloadPackageService, StepsService) {
        DownloadPackageService.reset();
        StepsService.updateStepsState($scope.currentStep);
        _.extend($scope, DownloadPackageService);
      }
    ]);

})(angular);
