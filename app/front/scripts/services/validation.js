'use strict';

var _ = require('lodash');
var goodtables = require('goodtables');

var goodtablesOptions = {
  apiUrl: 'https://goodtables.io/api',
  apiToken: 'D0123458B8E36326C60253FE4A7FF6662CAB0C48',
  apiSourceId: '9b6b6391-5404-4e7f-bdb8-271c2cb42fbb'
};

angular.module('Application')
  .factory('ValidationService', [
    '$q',
    function($q) {
      return {
        validateResource: function(source) {
          if (source.blob) source = source.blob;
          return goodtables.validate(source, goodtablesOptions);
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
