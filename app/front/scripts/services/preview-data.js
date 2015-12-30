;(function(angular) {

  angular.module('Application')
    .factory('PreviewDataService', [
      '$rootScope', '_', 'Services', 'PackageService', 'Configuration',
      function($rootScope, _, Services, PackageService, Configuration) {
        var result = {};

        var $scope = $rootScope.$new();
        result.scope = $scope;

        $scope.possibilities = Services
          .utils.availablePossibilities;

        $scope.selectedPossibility = null;

        var updatePreviewData = function() {
          $scope.previewData = Services.utils.getDataForPreview(
            PackageService.getResources(), 10);
        };

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
          updatePreviewData();
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
          updatePreviewData();
        };

        return result;
      }
    ]);

})(angular);
