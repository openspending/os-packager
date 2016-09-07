'use strict';

var _ = require('lodash');

angular.module('Application')
  .controller('ProvideMetadataController', [
    '$scope', 'PackageService', 'ProvideMetadataService',
    'ApplicationLoader',
    function($scope, PackageService, ProvideMetadataService,
      ApplicationLoader) {
      ApplicationLoader.then(function() {
        $scope.forms = _.extend({}, $scope.forms);

        $scope.geoData = ProvideMetadataService.getGeoData();
        $scope.state = ProvideMetadataService.getState();

        $scope.attributes = PackageService.getAttributes();

        var fiscalPeriod = null;
        if ($scope.attributes && $scope.attributes.fiscalPeriod) {
          fiscalPeriod = $scope.attributes.fiscalPeriod;
        }
        $scope.period = {
          start: fiscalPeriod ? fiscalPeriod.start : '',
          end: fiscalPeriod ? fiscalPeriod.end : ''
        };

        $scope.$watch('attributes.title', function() {
          $scope.state = ProvideMetadataService.validatePackage(
            $scope.forms.metadata);
        });

        $scope.$watch('attributes.name', function() {
          $scope.state = ProvideMetadataService.validatePackage(
            $scope.forms.metadata);
        });

        $scope.$watch('period', function(value) {
          ProvideMetadataService.updateFiscalPeriod(value);
          $scope.state = ProvideMetadataService.validatePackage(
            $scope.forms.metadata);
        }, true);

        $scope.$watch('attributes.regionCode', function() {
          ProvideMetadataService.updateCountries();
          $scope.geoData = ProvideMetadataService.getGeoData();
          $scope.state = ProvideMetadataService.validatePackage(
            $scope.forms.metadata);
        });

        $scope.$watch('attributes', function(newValue, oldValue) {
          if ((newValue === oldValue)) {
            return;
          }
          $scope.state = ProvideMetadataService.validatePackage(
            $scope.forms.metadata);
        }, true);
      });
    }
  ]);
