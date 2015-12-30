;(function(angular) {

  angular.module('Application')
    .controller('PreviewDataController', [
      '$scope', '_', 'PreviewDataService',
      function($scope, _, PreviewDataService) {
        _.extend($scope, PreviewDataService);
      }
    ]);

})(angular);
