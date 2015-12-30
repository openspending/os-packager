;(function(angular) {

  angular.module('Application')
    .factory('StepsService', [
      '$q', '_', 'Configuration',
      function($q, _, Configuration) {
        return {
          getSteps: function() {
            return Configuration.steps;
          },
          getStepById: function(stepId) {
            return _.findWhere(this.getSteps(), {
              id: stepId
            });
          },
          getNextStep: function(step) {
            var steps = this.getSteps();
            if (_.isObject(step)) {
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
          resetStepsFrom: function(step) {
            if (step) {
              var steps = this.getSteps();
              var found = false;
              _.each(steps, function(item) {
                if (found && item.reset) {
                  item.reset();
                }
                if (item.id == step.id) {
                  found = true;
                }
              });
            }
          },
          updateStepsState: function(step) {
            var steps = this.getSteps();
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
        };
      }
    ]);

})(angular);
