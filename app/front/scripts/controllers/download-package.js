;(function(angular) {

  angular.module('Application')
    .controller('DownloadPackageController', [
      '$scope', 'PackageService',
      function($scope, PackageService) {
        var dataPackage = PackageService.createFiscalDataPackage();
        $scope.dataPackage = dataPackage;
        $scope.serializeDataPackage = function() {
          return JSON.stringify(dataPackage, null, 2);
        };
      }
    ]);

})(angular);
