;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('ValidationService', [
      '$q', 'Configuration',
      function($q, Configuration) {
        return {
          validateResource: function(resource, validateSchema) {
            var validationResult = {
              inProgress: true
            };
            var schema = !!validateSchema ? resource.schema : undefined;
            var utils = require('app/services').utils;
            validationResult.$promise = $q(function(resolve, reject) {
              utils.validateData(resource.data.raw, schema)
                .then(resolve)
                .catch(reject);
            });
            validationResult.$promise
              .then(function(results) {
                validationResult.completed = true;
                if (results && results.length) {
                  validationResult.errors = results;
                }
                return results;
              })
              .catch(Configuration.defaultErrorHandler)
              .finally(function() {
                validationResult.inProgress = false;
              });

            return validationResult;
          }
        };
      }
    ]);

})(angular);
