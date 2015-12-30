;(function(angular) {

  var _ = require('underscore');
  var services = require('app/services');

  angular.module('Application')
    .constant('_', _)
    .constant('Services', services)
    .config([
      '$httpProvider', '$compileProvider', '$logProvider',
      function($httpProvider, $compileProvider, $logProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript):/);
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $logProvider.debugEnabled(true);
      }
    ]);

})(angular);
