'use strict';

var utils = require('../../../services/utils');

angular.module('Application')
  .factory('ApplicationLoader', [
    '$q', '$location', '$rootScope', 'UtilsService', 'PackageService',
    'Configuration',
    function($q, $location, $rootScope, UtilsService, PackageService,
      Configuration) {
      var promises = [
        // Preload continents and countries
        UtilsService.getCurrencies().$promise
          .catch(Configuration.defaultErrorHandler),
        UtilsService.getContinents().$promise
          .catch(Configuration.defaultErrorHandler),
        UtilsService.getCountries().$promise
          .catch(Configuration.defaultErrorHandler)
      ];

      var dataPackageUrl = $location.search().package;
      if (utils.isUrl) {
        promises.push(
          PackageService.loadExternalDataPackage(dataPackageUrl)
            .catch(Configuration.defaultErrorHandler)
        );
      }

      return $q.all(promises).then(function() {
        $rootScope.isExternalDataPackage =
          PackageService.isExternalDataPackage();
      }); // Force execute
    }
  ]);
