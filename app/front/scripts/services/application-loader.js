;(function(angular) {

  angular.module('Application')
    .factory('ApplicationLoader', [
      '$q', 'UtilsService',
      function($q, UtilsService) {
        var promises = [
          // Preload continents and countries
          UtilsService.getCurrencies().$promise,
          UtilsService.getContinents().$promise,
          UtilsService.getCountries().$promise
        ];

        return $q.all(promises).then(function() {}); // Force execute
      }
    ]);

})(angular);
