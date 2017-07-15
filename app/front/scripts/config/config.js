'use strict';

var _ = require('lodash');
var osDataStore = require('../../../services/os-datastore');
var fiscalDataPackage = require('../../../services/package');
var utils = require('../../../services/utils');

// See also `app/views/layouts/base.html`
var externalConfig = (window || this).ExternalConfig;

_.extend(osDataStore.defaultOptions, externalConfig.conductor);
fiscalDataPackage.defaultOptions.adapterUrl = externalConfig.adapterUrl;
utils.defaultOptions.proxyUrl = externalConfig.proxyUrl;

angular.module('Application')
  .config([
    '$httpProvider', '$compileProvider', '$logProvider',
    function($httpProvider, $compileProvider, $logProvider) {
      $compileProvider.aHrefSanitizationWhitelist(
        /^\s*(https?|ftp|mailto|file|javascript):/);
      $httpProvider.defaults.useXDomain = true;
      $httpProvider.defaults.withCredentials = true;
      $logProvider.debugEnabled(true);
    }
  ])
  .run([
    '$rootScope', 'ApplicationLoader',
    'StepsService', 'UploadFileService', 'DescribeDataService',
    'ProvideMetadataService', 'DownloadPackageService', 'Configuration',
    function($rootScope, ApplicationLoader,
      StepsService, UploadFileService, DescribeDataService,
      ProvideMetadataService, DownloadPackageService, Configuration) {
      $rootScope.ProcessingStatus = osDataStore.ProcessingStatus;

      Configuration.osViewerUrl = externalConfig.osViewerUrl;
      Configuration.osAdminUrl = externalConfig.osAdminUrl;

      StepsService.setStepResetCallbacks({
        /* eslint-disable quote-props */
        'upload-file': UploadFileService.resetState,
        'describe-data': DescribeDataService.resetState,
        'metadata': ProvideMetadataService.resetState,
        'download': DownloadPackageService.resetState
        /* eslint-enable quote-props */
      });

      ApplicationLoader.then(function() {
        $rootScope.applicationLoaded = true;
      });
    }
  ]);
