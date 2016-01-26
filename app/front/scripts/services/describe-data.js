;(function(angular) {

  angular.module('Application')
    .factory('DescribeDataService', [
      '_', 'PackageService', 'UtilsService', 'ValidationService',
      'PreviewDataService', 'ApplicationState', 'ApplicationLoader',
      'StepsService',
      function(_, PackageService, UtilsService, ValidationService,
        PreviewDataService, ApplicationState, ApplicationLoader,
        StepsService) {
        var result = {};

        var state = null;
        ApplicationLoader.then(function() {
          state = {};
          if (_.isObject(ApplicationState.describeData)) {
            state = ApplicationState.describeData;
          }
          ApplicationState.describeData = state;
        });

        result.resetState = function() {
          state = {};
          ApplicationState.describeData = state;
        };

        result.getState = function() {
          return state;
        };

        result.getSelectedConcepts = function(group) {
          var mapped = [];
          var resources = PackageService.getResources();
          _.each(resources, function(resource) {
            _.each(resource.fields, function(field) {
              var concept = UtilsService.findConcept(field.concept);
              if (concept && concept.group == group) {
                field = _.clone(field);
                field.concept = concept;
                field.options = _.chain(field.options)
                  .map(function(value, key) {
                    var option = _.findWhere(concept.options, {name: key});
                    if (option.values) {
                      var temp = _.findWhere(option.values, {value: value});
                      if (_.isObject(temp)) {
                        value = temp.name;
                      }
                    }
                    var isEmptyValue = _.isUndefined(value) ||
                      _.isNull(value) || (value == '');
                    if (isEmptyValue) {
                      return false;
                    }
                    return {
                      name: option.title,
                      value: value
                    };
                  })
                  .filter()
                  .value();
                mapped.push(field);
              }
            });
          });
          return mapped;
        };

        result.updateField = function(field) {
          if (!field) {
            return;
          }
          if (field.concept) {
            var concept = UtilsService.findConcept(field.concept);
            field.additionalOptions = concept.options;
            field.options = _.object(_.map(concept.options, function(item) {
              return [item.name, item.defaultValue];
            }));
            field.type = _.first(_.intersection(concept.allowedTypes,
              _.pluck(field.allowedTypes, 'id')));
          } else {
            field.type = field.inferredType;
            field.options = {};
          }
          state.status = ValidationService.validateResourcesConcepts(
            PackageService.getResources());

          PreviewDataService.update();

          return state;
        };

        return result;
      }
    ]);

})(angular);
