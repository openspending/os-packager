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

        $scope.$on('$routeChangeSuccess', function(event, route) {
          if (route.step) {
            $scope.currentStep = route.step;
            $scope.nextStep = StepsService.getNextStep($scope.steps,
              $scope.currentStep);
            StepsService.updateStepsState($scope.steps, $scope.currentStep);
          }
        });
      }
    ]);

})(angular);
