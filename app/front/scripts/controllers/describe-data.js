;(function(angular) {

  angular.module('Application')
    .controller('DescribeDataController', [
      '$scope', '_', 'DescribeDataService',
      function($scope, _, DescribeDataService) {
        _.extend($scope, DescribeDataService);
      }
    ]);

})(angular);
