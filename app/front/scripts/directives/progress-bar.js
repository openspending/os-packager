;(function(angular, undefined) {

  angular.module('Application')
    .directive('progressBar', [
      function() {
        return {
          restrict: 'EA',
          scope: {
            value: '@',
            label: '@'
          },
          templateUrl: 'templates/directives/progress.html',
          replace: true,
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
