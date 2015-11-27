;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('PackageService', [
      '$q',
      function($q) {
        var createNewDataPackage = function() {
          var FiscalDataPackage = require('app/services').FiscalDataPackage;
          var result = new FiscalDataPackage();

          result.attributes.regionCode = '';
          result.attributes.countryCode = '';
          result.attributes.cityCode = '';

          return result;
        };

        var dataPackage = null;

        return {
          createPackage: function() {
            dataPackage = createNewDataPackage();
            return dataPackage;
          },
          getPackage: function(forceRecreate) {
            if (!dataPackage || !!forceRecreate) {
              this.createPackage();
            }
            return dataPackage;
          },
          createResource: function(fileOrUrl) {
            var dataPackage = this.getPackage();
            return $q(function(resolve, reject) {
              dataPackage.resources.createFromSource(fileOrUrl)
                .then(resolve)
                .catch(reject);
            });
          },
          createFiscalDataPackage: function() {
            return this.getPackage().createFiscalDataPackage();
          }
        };
      }
    ]);

})(angular);
