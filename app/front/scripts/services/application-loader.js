;(function(angular) {

  angular.module('Application')
    .factory('ApplicationLoader', [
      '$q', 'UtilsService', 'StorageService',
      function($q, UtilsService, StorageService) {
        var promises = [
          // Preload continents and countries
          UtilsService.getCurrencies(),
          UtilsService.getCountries(),
          UtilsService.getCountries(),

          // Restore app state
          StorageService.restoreApplicationState()
        ];

        return $q.all(promises).then(function() {}); // Force execute
      }
    ]);

})(angular);
