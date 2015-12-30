;(function(angular, undefined) {

  angular.module('Visualization')
    .directive('donutChart', [
      'c3',
      function(c3) {
        return {
          restrict: 'EA',
          scope: {
            data: '='
          },
          link: function($scope, element) {
            var data = null;

            function prepare(data) {
              if (!data) {
                return false;
              }

              return data;
            }

            function render(data) {
              element.empty();
              if (!data) {
                return;
              }

              var chart = c3.generate({
                bindto: element.get(0),
                data: {
                  columns: [
                    ['data1', 30],
                    ['data2', 120]
                  ],
                  type : 'donut'
                }
              });
            }

            data = prepare($scope.data);
            render(data);

            $scope.$watch('data', function() {
              data = prepare($scope.data);
              render(data);
            });
          }
        };
      }
    ]);

})(angular);
