;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('PackageService', [
      '$q',
      function($q) {
        var FiscalDataPackage = require('app/services').FiscalDataPackage;
        var dataPackage = new FiscalDataPackage();

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
          },
          validateFiscalDataPackage: function() {
            return $q(function(resolve, reject) {
              dataPackage.validateFiscalDataPackage()
                .then(resolve)
                .catch(reject);
            });
          }
        };
      }
    ]);

})(angular);
