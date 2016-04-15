;(function(angular) {

  var goodTablesUrl = 'http://goodtables.okfnlabs.org/api/run';

  angular.module('Application')
    .factory('ValidationService', [
      '$q', '_', 'Services', 'Configuration',
      function($q, _, Services, Configuration) {
        var utils = Services.utils;

        return {
          validateResource: function(source) {
            var validationResult = {
              state: 'checking'
            };
            if (typeof(source) !== 'string') {
              validationResult.$promise = $q(function(resolve, reject) {
                utils.validateData(source.data, undefined, undefined,
                  goodTablesUrl)
                  .then(resolve)
                  .catch(reject);
              });
            } else {
              validationResult.$promise = $q(function(resolve, reject) {
                utils.validateData(undefined, source, undefined, goodTablesUrl)
                  .then(resolve)
                  .catch(reject);
              });
            }
            validationResult.$promise
              .then(function(results) {
                validationResult.state = 'completed';
                if (results && results.errors && results.errors.length) {
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
          },
          validateAttributesForm: function(form) {
            if (!form) {
              return;
            }
            if (!form.$valid) {
              return {
                state: 'invalid'
              };
            }
            return true;
          }
        };
      }
    ]);

})(angular);
