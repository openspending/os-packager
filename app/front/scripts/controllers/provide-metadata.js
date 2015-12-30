;(function(angular, undefined) {

  angular.module('Application')
    .controller('ProvideMetadataController', [
      '$scope', '_', 'ProvideMetadataService',
      function($scope, _, ProvideMetadataService) {
        _.extend($scope, ProvideMetadataService);
      }
    ]);

})(angular);
