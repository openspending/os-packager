;(function(angular, undefined) {

  angular.module('Visualization')
    .directive('pieChart', [
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

            var allowedTypes = ['pie', 'donut'];
            var type = (attr.type + '').toLowerCase();
            if (allowedTypes.indexOf(type) < 0) {
              type = allowedTypes[0];
            }

            function prepare(data) {
              if (!data) {
                return false;
              }

              return data.map(function(item) {
                return [item[name], item[value]];
              });
            }

            function render(data) {
              element.empty();
              if (!data) {
                return;
              }

              var chart = c3.generate({
                bindto: element.get(0),
                data: {
                  columns: data,
                  type: type
                },
                donut: {
                  label: {
                    format: function(v) { return v; }
                  }
                },
                pie: {
                  label: {
                    format: function(v) { return v; }
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
