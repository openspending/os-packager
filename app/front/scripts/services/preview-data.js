;(function(angular) {

  angular.module('Application')
    .factory('PreviewDataService', [
      '_', 'Services', 'PackageService', 'ApplicationState',
      'ApplicationLoader',
      function(_, Services, PackageService, ApplicationState,
      ApplicationLoader) {
        var result = {};

        var state = null;
        ApplicationLoader.then(function() {
          state = {};
          if (_.isObject(ApplicationState.previewData)) {
            state = ApplicationState.previewData;
          }
          state.selectedPossibility = null;
          ApplicationState.previewData = state;
        });

        var possibilities = Services.utils.availablePossibilities;

        result.getState = function() {
          return state;
        };

        result.getPossibilities = function() {
          return possibilities;
        };

        result.getPreviewData = function() {
          return Services.utils.getDataForPreview(
            PackageService.getResources(), 10);
        };

        result.update = function() {
          var resources = PackageService.getResources();
          _.each(possibilities, function(possibility) {
            possibility.update(resources);
          });
          if (state.selectedPossibility) {
            var possibility = _.findWhere(possibilities, {
              id: state.selectedPossibility
            });
            if (!possibility || !possibility.isAvailable) {
              possibility = _.findWhere(possibilities, {
                isAvailable: true
              });
              result.selectPossibility(possibility);
            }
          }
        };

        result.selectPossibility = function(possiblity) {
          state.selectedPossibility = null;
          if (_.isObject(possiblity)) {
            possiblity = _.findWhere(possibilities, {id: possiblity.id});
            if (_.isObject(possiblity) && possiblity.isAvailable) {
              state.selectedPossibility = possiblity.id;
              state.graph = possiblity.graph;
            }
          }
        };

        return result;
      }
    ]);

})(angular);
