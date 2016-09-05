'use strict';

var utils = require('../../../services/utils');

angular.module('Application')
  .factory('ApplicationLoader', [
    '$q', '$location', '$rootScope', 'UtilsService', 'PackageService',
    'Configuration', 'LoginService',
    function($q, $location, $rootScope, UtilsService, PackageService,
      Configuration, LoginService) {
      var promises = [
        // Preload continents and countries
        UtilsService.getCurrencies().$promise,
        UtilsService.getContinents().$promise,
        UtilsService.getCountries().$promise,
        LoginService.firstCheckAttempt()
      ];

      return $q.all(promises)
        .then(function() {
          var dataPackageUrl = $location.search().package;
          if (utils.isUrl) {
            return PackageService.loadExternalDataPackage(dataPackageUrl)
              .catch(function(error) {
                $rootScope.externalDataPackageError = error.message ||
                  ('' + error);
              });
          }
        })
        .then(function() {
          $rootScope.isExternalDataPackage =
            PackageService.isExternalDataPackage();
        })
        .catch(Configuration.defaultErrorHandler);
    }
  ]);
