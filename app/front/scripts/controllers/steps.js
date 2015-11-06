;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('StepsController', [
      '$scope', 'StepsService',
      function($scope, StepsService) {
        StepsService.getSteps().then(function(steps) {
          $scope.steps = steps;
          $scope.currentStep = _.first(steps);
        });
      }
    ]);

})(angular);
