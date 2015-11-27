;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('PackageService', [
      '$q',
      function($q) {
        var FiscalDataPackage = require('app/services').FiscalDataPackage;
        var dataPackage = new FiscalDataPackage();

        dataPackage.attributes.regionCode = '';
        dataPackage.attributes.countryCode = '';
        dataPackage.attributes.cityCode = '';

        return {
          getPackage: function() {
            return dataPackage;
          },
          createResource: function(fileOrUrl) {
            return $q(function(resolve, reject) {
              dataPackage.resources.createFromSource(fileOrUrl)
                .then(resolve)
                .catch(reject);
            });
          },
          createFiscalDataPackage: function() {
            return dataPackage.createFiscalDataPackage();
          }
        };
      }
    ]);

})(angular);
