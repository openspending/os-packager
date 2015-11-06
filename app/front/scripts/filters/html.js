;(function(angular) {

  angular.module('Application')
    .filter('html', [
      '$sce',
      function($sce) {
        return function(input) {
          return $sce.trustAsHtml(input);
        };
      }
    ]);

})(angular);
