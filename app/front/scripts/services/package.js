;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('PackageService', [
      '$q', 'UtilsService',
      function($q, UtilsService) {
        var FiscalDataPackage = require('app/services').FiscalDataPackage;
        var dataPackage = new FiscalDataPackage();

        return {
          getPackage: function() {
            return dataPackage;
          },
          createResource: function(fileOrUrl) {
            var reader = null;
            if (_.isObject(fileOrUrl)) {
              reader = UtilsService.getContentsFromFile(fileOrUrl);
            } else {
              reader = UtilsService.getContentsFromUrl(fileOrUrl);
            }

            return $q(function(resolve, reject) {
              dataPackage.resources.createFromReader(reader)
                .then(resolve)
                .catch(reject);
            });
          },
          createFiscalDataPackage: function() {
            // TODO: Implement
            return {};
          }
        };
      }
    ]);

})(angular);
