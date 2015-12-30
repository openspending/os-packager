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
          link: function($scope, element, attr) {
            var data = null;

            var name = attr.name || 'name';
            var value = attr.value || 'value';

            function prepare(data) {
              if (!data) {
                return false;
              }
              var result = data.map(function(item) {
                return {
                  name: item[name],
                  value: item[value]
                };
              });
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
                value: result.reduce(function(prev, value) {
                  return prev + value.value;
                }, 0),
                children: result
              });

              result.forEach(function(item, index) {
                item.color = index / (data.length - 1);
              });

              return result;
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

                svg.append('text')
                  .datum(item)
                  .attr('dy', '.75em')
                  .text(function(d) { return d.name; })
                  .call(text);
              });

              function text(text) {
                text
                  .attr('x', function(d) {
                    return x(d.x) + 4;
                  })
                  .attr('y', function(d) {
                    return y(d.y) + 4;
                  });
              }

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
