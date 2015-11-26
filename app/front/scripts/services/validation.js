;(function(angular) {

  var _ = require('underscore');

  var goodTablesUrl = '/proxy?url=' +
    encodeURIComponent('http://goodtables.okfnlabs.org/api/run');

  angular.module('Application')
    .factory('ValidationService', [
      '$q', 'Configuration',
      function($q, Configuration) {
        return {
          validateResource: function(resource, validateSchema) {
            var validationResult = {
              state: 'checking'
            };
            var schema = !!validateSchema ? resource.schema : undefined;
            var utils = require('app/services').utils;
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
          validateResourcesConcepts: function(resources) {
            var result = true;
            _.each(resources, function(resource) {
              // TODO: Make it based on `required` property of concept object
              var amountFound = false;
              var dateTimeFound = false;
              _.each(resource.fields, function(field) {
                if (field.concept == 'measures.amount') {
                  amountFound = !!field.currencyCode;
                }
                if (field.concept == 'dimensions.datetime') {
                  dateTimeFound = true;
                }
              });
              if (!amountFound || !dateTimeFound) {
                result = false;
              }
            });
            return result;
          }
        };
      }
    ]);

})(angular);
