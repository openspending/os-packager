var lodash = require('lodash');

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
          validateRequiredConcepts: function(resources) {
            var hasConcept = function(prefix) {
              return _.some(resources, function(resource) {
                return _.some(resource.fields, function(field) {
                  return lodash.startsWith(field.type, prefix);
                });
              });
            };
            var noErrors = function() {
              return _.every(resources, function(resource) {
                return _.every(resource.fields, function(field) {
                  return !field.errors || field.errors.length == [];
                });
              });
            };
            return hasConcept('value') &&
              hasConcept('date:') &&
              noErrors();
          },
          validateAttributesForm: function(form) {
            if (!form || !form.$dirty) {
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
