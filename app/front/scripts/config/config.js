'use strict';

var _ = require('lodash');
var osDataStore = require('../../../services/os-datastore');

// See also `gulpfile.js` and `app/views/layouts/base.html`
var externalConfig = (window || this).ExternalConfig;

_.extend(osDataStore.defaultOptions, externalConfig);

angular.module('Application')
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
    '$rootScope', 'ApplicationLoader',
    'StepsService', 'UploadFileService', 'DescribeDataService',
    'ProvideMetadataService', 'DownloadPackageService',
    function($rootScope, ApplicationLoader,
      StepsService, UploadFileService, DescribeDataService,
      ProvideMetadataService, DownloadPackageService) {
      $rootScope.ProcessingStatus = osDataStore.ProcessingStatus;

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
