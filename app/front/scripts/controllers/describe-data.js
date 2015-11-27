;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('DescribeDataController', [
      '$scope', 'DescribeDataService',
      function($scope, DescribeDataService) {
        _.extend($scope, DescribeDataService);
      }
    ]);

})(angular);
