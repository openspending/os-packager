'use strict';

var _ = require('lodash');

angular.module('Application')
  .controller('ProvideMetadataController', [
    '$scope', 'PackageService', 'ProvideMetadataService',
    'ApplicationLoader',
    function($scope, PackageService, ProvideMetadataService,
      ApplicationLoader) {

      var validateAttributes = _.debounce(function() {
        $scope.state = ProvideMetadataService.validatePackage(
          $scope.forms.metadata);
        $scope.$applyAsync();
      }, 500);

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

        $scope.$watch('period', function(value) {
          ProvideMetadataService.updateFiscalPeriod(value);
          validateAttributes();
        }, true);

        $scope.$watch('attributes.regionCode', function() {
          ProvideMetadataService.updateCountries();
          $scope.geoData = ProvideMetadataService.getGeoData();
        });

        $scope.$watch('attributes', function(newValue, oldValue) {
          if ((newValue === oldValue)) {
            return;
          }
          validateAttributes();
        }, true);

        // Initial validation
        var hasValues = _.chain($scope.attributes)
          .values()
          .filter(function(value) {
            if (_.isString(value)) {
              return value.length > 0;
            }
            return !!value;
          })
          .value()
          .length > 0;
        // If user has populated some attribute values - set dirty flag
        // and validate form
        if (hasValues) {
          $scope.forms.metadata.$setDirty();
        }
        validateAttributes();
        validateAttributes.flush();
      });
    }
  ]);
