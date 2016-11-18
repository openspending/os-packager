'use strict';

angular.module('Application')
  .controller('DownloadPackageController', [
    '$scope', 'PackageService', 'DownloadPackageService',
    'Configuration', 'ApplicationLoader', 'LoginService',
    function($scope, PackageService, DownloadPackageService,
      Configuration, ApplicationLoader, LoginService) {
      ApplicationLoader.then(function() {
        $scope.fileName = Configuration.defaultPackageFileName;
        $scope.attributes = PackageService.getAttributes();
        $scope.resources = PackageService.getResources();
        $scope.fiscalDataPackage = PackageService.createFiscalDataPackage();
        $scope.mappings = DownloadPackageService.generateMappings(
          PackageService.createFiscalDataPackage());
        $scope.login = LoginService;
        $scope.publishDataPackage = DownloadPackageService.publishDataPackage;
        $scope.state = DownloadPackageService.getState(true);
      });
    }
  ]);
