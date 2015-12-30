;(function(angular) {

  angular.module('Application')
    .controller('DownloadPackageController', [
      '$scope', '_', 'DownloadPackageService', 'StepsService',
      function($scope, _, DownloadPackageService, StepsService) {
        DownloadPackageService.reset();
        StepsService.updateStepsState($scope.currentStep);
        _.extend($scope, DownloadPackageService);
      }
    ]);

})(angular);
