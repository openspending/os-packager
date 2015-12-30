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
          link: function($scope, element, attr) {
            var data = null;

            var name = attr.name || 'name';
            var value = attr.value || 'value';

            var allowedTypes = ['line', 'spline', 'area-spline', 'area-step'];
            var type = (attr.type + '').toLowerCase();
            if (allowedTypes.indexOf(type) < 0) {
              type = allowedTypes[0];
            }

            function prepare(data) {
              if (!data) {
                return false;
              }

              var values = ['Preview'];
              [].push.apply(values, data.map(function(item) {
                return item[value];
              }));

              var x = ['x'];
              [].push.apply(x, data.map(function(item) {
                return item[name];
              }));

              return [x, values];
            }

            function render(data) {
              element.empty();
              if (!data) {
                return;
              }

              var chart = c3.generate({
                bindto: element.get(0),
                data: {
                  x: 'x',
                  columns: data,
                  type: type
                },
                legend: {
                  show: false
                },
                axis: {
                  x: {
                    type: 'category',
                    tick: {
                      rotate: 55,
                      multiline: false
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
