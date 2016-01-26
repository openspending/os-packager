;(function(angular) {

  var _ = require('underscore');
  var services = require('app/services');

  angular.module('Application')
    .constant('_', _)
    .constant('Services', services)
    .value('ApplicationState', {})
    .config([
      '$httpProvider', '$compileProvider', '$logProvider',
      function($httpProvider, $compileProvider, $logProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript):/);
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $logProvider.debugEnabled(true);
      }
    ])
    .run([
      '$rootScope', 'Services', 'ApplicationLoader',
      function($rootScope, Services, ApplicationLoader) {
        $rootScope.ProcessingStatus = Services.datastore.ProcessingStatus;
        ApplicationLoader.then(function() {
          $rootScope.applicationLoaded = true;
        });
      }
    ]);

})(angular);
