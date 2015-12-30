;(function(angular) {

  angular.module('Application')
    .filter('fieldConcepts', [
      '_',
      function(_) {
        return function(field) {
          var result = field.allowedConcepts;
          if (!!field.type) {
            result = _.filter(result, function(concept) {
              return _.contains(concept.allowedTypes, field.type);
            });
          }
          return result;
        };
      }
    ])
    .filter('fieldTypes', [
      '_', 'UtilsService',
      function(_, UtilsService) {
        return function(field) {
          var result = field.allowedTypes;
          if (!!field.concept) {
            var concept = UtilsService.findConcept(field.concept);
            result = _.filter(result, function(type) {
              return _.contains(concept.allowedTypes, type.id);
            });
          }
          return result;
        };
      }
    ]);

})(angular);
