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
          var data;
          if (source.data) {
            data = source.data;
            var byteView = new Uint8Array(data);
            var byteLimit = 64 * 1024;
            if (byteView.length > byteLimit) {
              var bl = 64 * 1024;
              var cutoff = -1;
              if (byteView.indexOf) {
                cutoff = byteView.indexOf(10, bl - 1024);
              } else {
                for (var i = bl - 1024; i < bl; i++) {
                  if (byteView[i] === 10) {
                    cutoff = i;
                  }
                }
              }
              if (cutoff === -1 || cutoff > bl) {
                byteView = byteView.subarray(0, bl);
              } else {
                byteView = byteView.subarray(0, cutoff);
              }
            }
            data = new File([byteView],
                            source.blob.name,
                            {type: source.blob.type});
          } else {
            data = source;
          }

          return goodtables.validate(data, goodtablesOptions);
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
