;(function(angular) {

  angular.module('Application')
    .factory('PreviewDataService', [
      '$rootScope', '_', 'PackageService', 'Configuration',
      function($rootScope, _, PackageService, Configuration) {
        var result = {};

        var $scope = $rootScope.$new();
        result.scope = $scope;

        $scope.possibilities = require('app/services')
          .utils.availablePossibilities;

        $scope.selectedPossibility = null;

        $scope.$on(Configuration.events.CONCEPTS_CHANGED, function() {
          var resources = PackageService.getResources();
          _.each($scope.possibilities, function(possibility) {
            possibility.update(resources);
          });
          if ($scope.selectedPossibility) {
            var possibility = _.findWhere($scope.possibilities, {
              id: $scope.selectedPossibility
            });
            if (!possibility || !possibility.isAvailable) {
              possibility = _.findWhere($scope.possibilities, {
                isAvailable: true
              });
              result.selectPossibility(possibility);
            }
          }
        });

        result.selectPossibility = function(possiblity) {
          $scope.selectedPossibility = null;
          if (_.isObject(possiblity)) {
            possiblity = _.findWhere($scope.possibilities, {id: possiblity.id});
            if (_.isObject(possiblity) && possiblity.isAvailable) {
              $scope.selectedPossibility = possiblity.id;
              $scope.graph = possiblity.graph;
            }
          }

          $scope.previewData = [
            {name: 'AggregateExpression', value: 1616},
            {name: 'And', value: 1027},
            {name: 'Arithmetic', value: 3891},
            {name: 'Average', value: 891},
            {name: 'BinaryExpression', value: 2893},
            {name: 'Comparison', value: 5103},
            {name: 'CompositeExpression', value: 3677},
            {name: 'Count', value: 781},
            {name: 'DateUtil', value: 4141},
            {name: 'Distinct', value: 933},
            {name: 'Expression', value: 5130},
            {name: 'ExpressionIterator', value: 3617},
            {name: 'Fn', value: 3240},
            {name: 'If', value: 2732},
            {name: 'IsA', value: 2039},
            {name: 'Literal', value: 1214},
            {name: 'Match', value: 3748},
            {name: 'Maximum', value: 843},
            {name: 'Minimum', value: 843},
            {name: 'Not', value: 1554},
            {name: 'Or', value: 970},
            {name: 'Query', value: 13896},
            {name: 'Range', value: 1594},
            {name: 'StringUtil', value: 4130},
            {name: 'Sum', value: 791},
            {name: 'Variable', value: 1124},
            {name: 'Variance', value: 1876},
            {name: 'Xor', value: 1101}
          ];
        };

        return result;
      }
    ]);

})(angular);
