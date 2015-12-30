;(function(angular, undefined) {

  angular.module('Visualization')
    .directive('lineChart', [
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
                    ['data1', 30, 200, 100, 400, 150, 250],
                    ['data2', 130, 100, 140, 200, 150, 50]
                  ],
                  type: 'spline'
                },
                axis: {
                  x: {
                    tick: {
                      format: function(v) { return ''; }
                    }
                  },
                  y: {
                    tick: {
                      format: function(v) { return ''; }
                    }
                  }
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
