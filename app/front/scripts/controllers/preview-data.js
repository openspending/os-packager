;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('PreviewDataController', [
      '$scope', 'PreviewDataService',
      function($scope, PreviewDataService) {
        _.extend($scope, PreviewDataService);
      }
    ]);

})(angular);
