'use strict';

var _ = require('lodash');

angular.module('Application')
  .filter('fieldConcepts', [
    function() {
      return function(field) {
        var result = field.allowedConcepts;
        if (!!field.type) {
          result = _.filter(result, function(concept) {
            return !!_.find(concept.allowedTypes, function(item) {
              return item == field.type;
            });
          });
        }
        return result;
      };
    }
  ])
  .filter('fieldTypes', [
    'UtilsService',
    function(UtilsService) {
      return function(field) {
        var result = field.allowedTypes;
        if (!!field.concept) {
          var concept = UtilsService.findConcept(field.concept);
          result = _.filter(result, function(type) {
            return !!_.find(concept.allowedTypes, function(item) {
              return item == type.id;
            });
          });
        }
        return result;
      };
    }
  ]);
