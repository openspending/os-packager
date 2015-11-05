;(function(angular, _) {

  angular.module('Application')
    .factory('PackageService', [
      '$q', 'UtilsService',
      function($q, UtilsService) {
        return {
          validate: function(fileOrUrl) {
            return $q(function(resolve, reject) {
              var CsvValidate = require('app/services').csvValidate;
              var reader = null;
              if (_.isObject(fileOrUrl)) {
                reader = UtilsService.getContentsFromFile(fileOrUrl);
              } else {
                reader = UtilsService.getContentsFromUrl(fileOrUrl);
              }
              reader
                .then(function(data) {
                  return CsvValidate.getCsvSchema(data);
                })
                .then(function(source) {
                  return CsvValidate.validateData(source.data, source.schema)
                })
                .then(resolve)
                .catch(reject);
            });
          }
        };
      }
    ]);

})(angular, _);
