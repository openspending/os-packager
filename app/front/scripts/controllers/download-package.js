'use strict';
var osAdminService = require('../services/admin');

angular.module('Application')
  .controller('DownloadPackageController', [
    '$scope', 'PackageService', 'DownloadPackageService',
    'Configuration', 'ApplicationLoader', 'LoginService', '$interval', '$http',
    function($scope, PackageService, DownloadPackageService,
      Configuration, ApplicationLoader, LoginService, $interval, $http) {
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
        $scope.packageOBEUStatus = null;
      });

      $scope.publishAndRunWebHooks = function () {
        $scope.publishDataPackage().finally(function (res) {
          runWebHooks($scope.fiscalDataPackage.name);
        });
      };


      function runWebHooks(packageId) {
        $scope.packageOBEUStatus = 'processing';
        // query data packages to extract the user's "owner id"
        osAdminService.getDataPackages(LoginService.authToken, LoginService.userId).then(function (packages) {
          console.log(packages);
          var ownerId = packages[0].owner;
          var dataPackageId = ownerId + ":" + packageId;

          // set the data package status to "published" (a.k.a. public)
          osAdminService.togglePackagePublicationStatus(LoginService.permissionToken, {id: dataPackageId}).then(
            function (res) {
              // run web hooks for the package
              var dataPackage = _.find(packages, {id: dataPackageId});

              if (dataPackage) {
                var token = LoginService.permissionToken;
                osAdminService.runWebHooks(token, dataPackage).then(function(res) {
                  var iri = JSON.parse(res.response).iri;
                  var executionId = iri.substr(1 + iri.lastIndexOf('/'), iri.length);
                  var executionOverviewUrl =
                    'http://apps.openbudgets.eu/linkedpipes/test/resources/executions/' + executionId + '/overview';
                  pollPipelineUntilReady(executionOverviewUrl);
                });
              }
            }
          );
        },
        function (err) {
          console.log(err);
        });
      };

      function pollPipelineUntilReady(executionOverviewUrl) {
        stop = $interval(function () {
          $http.get('https://crossorigin.me/' + executionOverviewUrl, {withCredentials: false}).then(
            function (res) {
              console.log(res);
              if (res.data.status['@id'].includes('finished')) {
                $interval.cancel(stop);
                $scope.packageOBEUStatus = 'ready';
              }
            },
            function (err) {
              console.log(err);
            }
          );
        }, 3000);
      }
    }
  ]);
