;(function(angular) {

  angular.module('Application')
    .config([
      '$httpProvider', '$compileProvider',
      function($httpProvider, $compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript):/);
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
      }
    ]);

})(angular);
