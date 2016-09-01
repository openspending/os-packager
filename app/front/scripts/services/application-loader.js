'use strict';

var utils = require('../../../services/utils');

angular.module('Application')
  .factory('ApplicationLoader', [
    '$q', '$location', '$rootScope', 'UtilsService', 'PackageService',
    function($q, $location, $rootScope, UtilsService, PackageService) {
      var promises = [
        // Preload continents and countries
        UtilsService.getCurrencies().$promise,
        UtilsService.getContinents().$promise,
        UtilsService.getCountries().$promise
      ];

      var dataPackageUrl = $location.search().package;
      if (utils.isUrl) {
        promises.push(PackageService.loadExternalDataPackage(dataPackageUrl));
      }

      return $q.all(promises).then(function() {
        $rootScope.isExternalDataPackage =
          PackageService.isExternalDataPackage();
      }); // Force execute
    }
  ]);
