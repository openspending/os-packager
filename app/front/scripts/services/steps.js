;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('StepsService', [
      '$q', 'Configuration',
      function($q, Configuration) {
        return {
          getSteps: function() {
            return $q(function(resolve, reject) {
              resolve(Configuration.steps);
            });
          },
          getNextStep: function(steps, step) {
            if (!!steps && _.isObject(step)) {
              var isFound = false;
              return _.find(steps, function(item) {
                if (item.id == step.id) {
                  isFound = true;
                  return false;
                }
                return isFound;
              });
            }
          },
          updateStepsState: function(steps, step) {
            if (!!steps) {
              _.each(steps, function(item) {
                item.isCurrent = false;
              });
              if (_.isObject(step)) {
                // Side effect!!!
                _.find(steps, function(item) {
                  if (item.id == step.id) {
                    item.isCurrent = true;
                    return true;
                  }
                  item.isPassed = true;
                  return false;
                });
              }
              var lastStep = _.last(steps);
              if (lastStep.isCurrent) {
                lastStep.isPassed = true;
              }
            }
          }
        };
      }
    ]);

})(angular);
