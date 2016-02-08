;(function(angular) {

  angular.module('Application')
    .factory('ApplicationLoader', [
      '$q', 'UtilsService', 'StorageService',
      function($q, UtilsService, StorageService) {
        var promises = [
          // Preload continents and countries
          UtilsService.getCurrencies().$promise,
          UtilsService.getCountries().$promise,
          UtilsService.getCountries().$promise,

          // Restore app state
          StorageService.restoreApplicationState()
        ];

        return $q.all(promises).then(function() {}); // Force execute
      }
    ]);

})(angular);
