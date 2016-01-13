;(function(angular, undefined) {

  angular.module('Application')
    .directive('progressBar', [
      function() {
        return {
          restrict: 'EA',
          scope: {
            value: '@',
            showLabel: '@'
          },
          templateUrl: '/templates/directives/progress.html',
          link: function($scope, element, attr) {
            $scope.$watch('value', function(newValue, oldValue) {
              if (newValue !== oldValue) {
                newValue = parseFloat(newValue);
                if (isFinite(newValue) && (newValue >= 0)) {
                  $scope.value = newValue;
                } else {
                  $scope.value = 0.0;
                }
              }
            });
          }
        };
      }
    ]);

})(angular);
