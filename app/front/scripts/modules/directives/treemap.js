;(function(angular, undefined) {

  angular.module('Visualization')
    .directive('treemap', [
      '$window', 'd3',
      function($window, d3) {
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
              var treemap = d3.layout.treemap()
                .children(function(d, depth) {
                  return depth ? null : d.children;
                })
                .sort(function(a, b) {
                  return a.value - b.value;
                })
                .ratio(0.5 * (1 + Math.sqrt(5)))
                .round(false);

              treemap.nodes({
                name: 'root',
                value: data.reduce(function(prev, value) {
                  return prev + value.value;
                }, 0),
                children: data
              });

              var min = null;
              var max = null;
              data.forEach(function(item) {
                if ((min === null) || (item.value < min)) {
                  min = item.value;
                }
                if ((max === null) || (item.value > max)) {
                  max = item.value;
                }
              });
              max += min;
              data.forEach(function(item) {
                item.color = (item.value + min) / max;
              });

              return data;
            }

            function render(data) {
              element.empty();
              if (!data) {
                return;
              }
              var width = element.width();
              var height = element.height();

              var svg = d3.select(element.get(0)).append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .style('shape-rendering', 'crispEdges');

              var x = d3.scale.linear()
                .domain([0, 1])
                .range([0, width]);

              var y = d3.scale.linear()
                .domain([0, 1])
                .range([0, height]);

              var color = d3.scale.linear()
                .domain([
                  0, 0.2,
                  0.2, 0.4,
                  0.4, 0.6,
                  0.6, 0.8,
                  0.8, 1
                ])
                .range([
                  '#FFCDD2', '#B71C1C',
                  '#D1C4E9', '#311B92',
                  '#BBDEFB', '#0D47A1',
                  '#C8E6C9', '#1B5E20',
                  '#FFF9C4', '#FBC02D'
                ]);

              data.forEach(function(item) {
                svg.append('rect')
                  .datum(item)
                  .call(rect)
                  .append('title')
                  .text(function(d) { return d.value; });
              });

              function rect(rect) {
                rect
                  .attr('fill', function(d) {
                    return color(d.color);
                  })
                  .attr('x', function(d) {
                    return x(d.x);
                  })
                  .attr('y', function(d) {
                    return y(d.y);
                  })
                  .attr('width', function(d) {
                    return x(d.x + d.dx) - x(d.x);
                  })
                  .attr('height', function(d) {
                    return y(d.y + d.dy) - y(d.y);
                  });
              }
            }

            function resize() {
              render(data);
            }

            data = prepare($scope.data);
            render(data);

            $scope.$watch('data', function() {
              data = prepare($scope.data);
              render(data);
            });

            $($window).on('resize', resize);

            $scope.$on('$destroy', function() {
              $(window).off('resize', resize);
            });
          }
        };
      }
    ]);

})(angular);
