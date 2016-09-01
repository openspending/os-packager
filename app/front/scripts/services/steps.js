'use strict';

var _ = require('lodash');

angular.module('Application')
  .factory('StepsService', [
    '$q', '$location', 'Configuration', 'ApplicationLoader', 'PackageService',
    function($q, $location, Configuration, ApplicationLoader, PackageService) {
      var currentStep = null;
      var steps = [];

      var resetCallbacks = {};

      ApplicationLoader.then(function() {
        if (steps.length == 0) {
          steps = Configuration.steps;
        }

        // Remove first step when editing external package and mark
        // all other steps as passed
        if (PackageService.isExternalDataPackage) {
          steps = steps.slice(1, steps.length);
          _.each(steps, function(step) {
            step.isPassed = true;
          });
        }
        currentStep = _.first(steps);
        result.updateStepsState(currentStep);

        if (Configuration.isWizard) {
          $location.path(currentStep.route);
        }
      });

      var result = {
        getCurrentStep: function() {
          return currentStep;
        },
        goToStep: function(step, goNext) {
          if (step) {
            if (goNext || step.isPassed || step.isCurrent) {
              currentStep = step;
              result.updateStepsState(step);
              $location.path(step.route);
            } else {
              $location.path('/');
            }
          }
          return currentStep;
        },
        getSteps: function() {
          return steps;
        },
        getStepById: function(stepId) {
          return _.find(this.getSteps(), {
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
        setStepResetCallback: function(stepId, callback) {
          resetCallbacks[stepId] = callback;
        },
        setStepResetCallbacks: function(callbacks) {
          _.extend(resetCallbacks, callbacks);
        },
        resetStepsFrom: function(step, updateCurrentStep) {
          if (step) {
            var steps = this.getSteps();
            var found = false;
            _.each(steps, function(item) {
              if (found) {
                item.isPassed = false;
                item.isCurrent = false;
                if (_.isFunction(resetCallbacks[item.id])) {
                  resetCallbacks[item.id]();
                }
              }
              if (item.id == step.id) {
                found = item;
                if (_.isFunction(resetCallbacks[item.id])) {
                  resetCallbacks[item.id]();
                }
              }
            });
            if (updateCurrentStep && found) {
              result.goToStep(found);
            }
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

      return result;
    }
  ]);
