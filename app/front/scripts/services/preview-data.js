;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('PreviewDataService', [
      '$rootScope', 'PackageService', 'Configuration',
      function($rootScope, PackageService, Configuration) {
        var result = {};

        var $scope = $rootScope.$new();
        result.scope = $scope;

        $scope.displayGraph = false;
        $scope.possibilities = require('app/services')
          .utils.availablePossibilities;

        $scope.$on(Configuration.events.CONCEPTS_CHANGED, function() {
          var resources = PackageService.getResources();
          _.each($scope.possibilities, function(possibility) {
            possibility.update(resources);
          });
        });

        return result;
      }
    ]);

})(angular);
