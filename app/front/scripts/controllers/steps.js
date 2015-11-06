;(function(angular, _) {

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

})(angular, _);
