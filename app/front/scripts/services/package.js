;(function(angular) {

  angular.module('Application')
    .factory('PackageService', [
      '$q', '_',
      function($q, _) {
        var attributes = {};
        var resources = [];
        var schema = null;

        var fiscalDataPackage = require('app/services').fiscalDataPackage;
        var utils = require('app/services').utils;
        fiscalDataPackage.getFiscalDataPackageSchema().then(function(result) {
          schema = result;
        });

        var createNewDataPackage = function() {
          attributes.regionCode = '';
          attributes.countryCode = '';
          attributes.cityCode = '';
          resources.splice(0, resources.length);
        };
        createNewDataPackage();

        return {
          getAttributes: function() {
            return attributes;
          },
          getResources: function() {
            return resources;
          },
          recreatePackage: function() {
            createNewDataPackage();
          },
          createResource: function(fileOrUrl) {
            return $q(function(resolve, reject) {
              fiscalDataPackage.createResourceFromSource(fileOrUrl)
                .then(resolve)
                .catch(reject);
            });
          },
          addResource: function(resource) {
            utils.addItemWithUniqueName(resources, resource);
          },
          removeAllResources: function() {
            resources.splice(0, resources.length);
          },
          validateFiscalDataPackage: function() {
            var dataPackage = this.createFiscalDataPackage();
            return $q(function(resolve, reject) {
              return fiscalDataPackage.validateDataPackage(dataPackage, schema)
                .then(resolve)
                .catch(reject);
            });
          },
          createFiscalDataPackage: function() {
            return fiscalDataPackage.createFiscalDataPackage(attributes,
              resources);
          }
        };
      }
    ]);

})(angular);
