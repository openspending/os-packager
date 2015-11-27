;(function(angular, undefined) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('ProvideMetadataController', [
      '$scope', 'ProvideMetadataService',
      function($scope, ProvideMetadataService) {
        _.extend($scope, ProvideMetadataService);
      }
    ]);

})(angular);
