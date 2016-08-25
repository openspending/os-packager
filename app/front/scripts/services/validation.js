'use strict';

var _ = require('lodash');
var utils = require('../../../services/utils');

var goodTablesUrl = 'http://goodtables.okfnlabs.org/api/run';

angular.module('Application')
  .factory('ValidationService', [
    '$q', 'Configuration',
    function($q, Configuration) {
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
        validateRequiredConcepts: function(errors, resources) {
          var hasConcept = function(prefix) {
            return _.some(resources, function(resource) {
              return _.some(resource.fields, function(field) {
                return _.startsWith(field.type, prefix);
              });
            });
          };
          return hasConcept('value') &&
            hasConcept('date:') &&
            !errors;
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
