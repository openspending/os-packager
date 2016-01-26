;(function(angular) {

  angular.module('Application')
    .controller('StepsController', [
      '$scope', 'StepsService', 'ApplicationLoader',
      function($scope, StepsService, ApplicationLoader) {
        ApplicationLoader.then(function() {
          $scope.steps = StepsService.getSteps();
          $scope.currentStep = StepsService.getCurrentStep();
          $scope.nextStep = StepsService.getNextStep($scope.currentStep);

          $scope.goToStep = function(step) {
            $scope.currentStep = StepsService.goToStep(step);
          };

          $scope.goToNextStep = function() {
            $scope.currentStep = StepsService.goToStep($scope.nextStep, true);
          };

          $scope.resetFromCurrentStep = function() {
            StepsService.resetStepsFrom($scope.currentStep);
          };

          $scope.$on('$routeChangeSuccess', function(event, route) {
            if (route.step) {
              var step = StepsService.getStepById(route.step.id);
              $scope.currentStep = StepsService.goToStep(step);
              $scope.nextStep = StepsService.getNextStep($scope.currentStep);
            }
          });
        });
      }
    ]);

})(angular);
