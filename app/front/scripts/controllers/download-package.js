;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('DownloadPackageController', [
      '$scope', 'DownloadPackageService',
      function($scope, DownloadPackageService) {
        _.extend($scope, DownloadPackageService);
      }
    ]);

})(angular);
