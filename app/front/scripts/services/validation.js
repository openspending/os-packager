;(function(angular) {

  var goodTablesUrl = '/proxy?url=' +
    encodeURIComponent('http://goodtables.okfnlabs.org/api/run');

  angular.module('Application')
    .factory('ValidationService', [
      '$q', '_', 'Services', 'PackageService', 'Configuration',
      function($q, _, Services, PackageService, Configuration) {
        var utils = Services.utils;

        return {
          validateResource: function(resource, validateSchema) {
            var validationResult = {
              state: 'checking'
            };
            var schema = !!validateSchema ? resource.schema : undefined;
            validationResult.$promise = $q(function(resolve, reject) {
              utils.validateData(resource.data.raw, schema, goodTablesUrl)
                .then(resolve)
                .catch(reject);
            });
            validationResult.$promise
              .then(function(results) {
                validationResult.state = 'completed';
                if (results && results.length) {
                  validationResult.errors = results;
                }
                return results;
              })
              .catch(function(error) {
                validationResult.state = null;
                Configuration.defaultErrorHandler(error);
              });

            return validationResult;
          },
          validateFiscalDataPackage: function() {
            var validationResult = {
              state: 'checking'
            };
            validationResult.$promise = PackageService
              .validateFiscalDataPackage();

            validationResult.$promise
              .then(function(results) {
                validationResult.state = 'completed';
                if (results && !results.valid) {
                  validationResult.errors = results.errors;
                }
                return results;
              })
              .catch(function(error) {
                validationResult.state = null;
                Configuration.defaultErrorHandler(error);
              });

            return validationResult;
          },
          validateResourcesConcepts: function(resources) {
            var requiredConcepts = _.chain(utils.availableConcepts)
              .filter(function(item) {
                return !!item.required;
              })
              .map(function(item) {
                return [item.id, false];
              })
              .object()
              .value();

            _.each(resources, function(resource) {
              _.each(resource.fields, function(field) {
                if (requiredConcepts.hasOwnProperty(field.concept)) {
                  requiredConcepts[field.concept] = true;
                }
              });
            });

            // There should not be `false` values
            return !_.contains(requiredConcepts, false);
          }
        };
      }
    ]);

})(angular);
