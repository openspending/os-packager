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
      'StepsService', 'UploadFileService', 'DescribeDataService',
      'ProvideMetadataService', 'DownloadPackageService',
      function($rootScope, Services, ApplicationLoader,
        StepsService, UploadFileService, DescribeDataService,
        ProvideMetadataService, DownloadPackageService) {
        $rootScope.ProcessingStatus = Services.datastore.ProcessingStatus;

        StepsService.setStepResetCallbacks({
          'upload-file': UploadFileService.resetState,
          'describe-data': DescribeDataService.resetState,
          'metadata': ProvideMetadataService.resetState,
          'download': DownloadPackageService.resetState
        });

        ApplicationLoader.then(function() {
          $rootScope.applicationLoaded = true;
        });
      }
    ]);

})(angular);
