;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('PreviewDataService', [
      '$rootScope', 'PackageService', 'Configuration',
      function($rootScope, PackageService, Configuration) {
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
              isAvailable: true
            });
            result.selectPossibility(possibility);
          }
        });

        result.selectPossibility = function(possiblity) {
          $scope.selectedPossibility = null;
          if (_.isObject(possiblity)) {
            possiblity = _.findWhere($scope.possibilities, {id: possiblity.id});
            if (_.isObject(possiblity) && possiblity.isAvailable) {
              $scope.selectedPossibility = possiblity.id;
            }
          }
        };

        return result;
      }
    ]);

})(angular);
