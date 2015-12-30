;(function(angular) {

  angular.module('Application')
    .controller('StepsController', [
      '$scope', '$location', '_', 'StepsService',
      function($scope, $location, _, StepsService) {
        $scope.steps = StepsService.getSteps();
        $scope.currentStep = _.first($scope.steps);
        StepsService.updateStepsState($scope.currentStep);

        $scope.goToStep = function(step) {
          if (step) {
            StepsService.updateStepsState(step);
            $location.path(step.route);
          }
        };

        $scope.$on('$routeChangeSuccess', function(event, route) {
          if (route.step) {
            var step = StepsService.getStepById(route.step.id);
            if (step.isPassed || step.isCurrent) {
              $scope.currentStep = step;
              $scope.nextStep = StepsService.getNextStep($scope.currentStep);
              StepsService.updateStepsState($scope.currentStep);
            } else {
              $location.path('/');
            }
          }
        });
      }
    ]);

})(angular);
