'use strict';

var utils = require('../../../services/utils');

angular.module('Application')
  .factory('ApplicationLoader', [
    '$q', '$location', '$rootScope', 'UtilsService', 'PackageService',
    'Configuration', 'LoginService',
    function($q, $location, $rootScope, UtilsService, PackageService,
      Configuration) {
      var promises = [
        // Preload continents and countries
        UtilsService.getCurrencies().$promise,
        UtilsService.getContinents().$promise,
        UtilsService.getCountries().$promise
      ];

      var dataPackageUrl = $location.search().package;
      if (utils.isUrl) {
        promises.push(
          PackageService.loadExternalDataPackage(dataPackageUrl)
            .then(function() {
              $rootScope.isExternalDataPackage =
                PackageService.isExternalDataPackage();
            })
            .catch(function(error) {
              $rootScope.externalDataPackageError = error.message ||
                ('' + error);
            })
        );
      }

      return $q.all(promises)
        .then(function() {})
        .catch(Configuration.defaultErrorHandler);
    }
  ]);
