;(function(angular) {

  angular.module('Application')
    .controller('DownloadPackageController', [
      '$scope', 'PackageService', 'DownloadPackageService',
      'Configuration', 'ApplicationLoader',
      function($scope, PackageService, DownloadPackageService,
        Configuration, ApplicationLoader) {
        ApplicationLoader.then(function() {
          $scope.fileName = Configuration.defaultPackageFileName;
          $scope.attributes = PackageService.getAttributes();
          $scope.resources = PackageService.getResources();
          $scope.fiscalDataPackage = PackageService.createFiscalDataPackage();
          $scope.mappings = DownloadPackageService.generateMappings(
            PackageService.createFiscalDataPackage());
        });
      }
    ]);

})(angular);
