'use strict';
var osAdminService = require('../services/admin');

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
        LoginService.check();
      });

      $scope.runWebHooks = function(packageId) {
        // query data packages to extract the user's "owner id"
        osAdminService.getDataPackages(LoginService.authToken, LoginService.userId).then(function (packages) {
          console.log(packages);
          var ownerId = packages[0].owner;
          var dataPackageId = ownerId + ":" + packageId;

          // set the data package status to "published" (a.k.a. public)
          osAdminService.togglePackagePublicationStatus(LoginService.permissionToken, {id: dataPackageId}).then(
            function (res) {
              // run web hooks for the package
              console.log(res);
              var dataPackage = _.find(packages, {id: dataPackageId});
              console.log(dataPackage);

              if (dataPackage) {
                dataPackage.isRunningWebhooks = true;
                var token = LoginService.permissionToken;
                osAdminService.runWebHooks(token, dataPackage).then(function() {
                  dataPackage.isRunningWebhooks = false;
                });
              }
            }
          );
        },
        function (err) {
          console.log(err);
        });
      };
    }
  ]);
