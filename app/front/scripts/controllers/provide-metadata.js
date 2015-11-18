;(function(angular, undefined) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('ProvideMetadataController', [
      '$scope', 'PackageService', 'UtilsService', 'Configuration',
      function($scope, PackageService, UtilsService, Configuration) {
        $scope.attributes = PackageService.getPackage().attributes;

        $scope.attributes.regionCode = '';
        $scope.attributes.countryCode = '';
        $scope.attributes.cityCode = '';

        $scope.$watch('attributes.title', function(value) {
          $scope.attributes.name = UtilsService.slug(value);
        });

        var updatePeriod = function() {
          var period = [];
          if ($scope.period) {
            period = _.filter([
              $scope.period.from || $scope.period.to,
              $scope.period.to || $scope.period.from
            ]);
          }
          $scope.attributes.fiscalPeriod = period.length == 0 ? undefined
            : period.join('/');
        };

        $scope.$watch('period.from', updatePeriod);
        $scope.$watch('period.to', updatePeriod);

        var prependEmptyItem = function(items) {
          return _.union([{
            code: '',
            name: ''
          }], items);
        };

        $scope.regions = prependEmptyItem([]);
        $scope.countries = prependEmptyItem([]);
        $scope.cities = prependEmptyItem([]);

        UtilsService.getRegions().$promise
          .then(prependEmptyItem)
          .then(function(items) {
            $scope.regions = items;
          });
        UtilsService.getCountries().$promise
          .then(prependEmptyItem)
          .then(function(items) {
            $scope.countries = items;
          });
        UtilsService.getCities().$promise
          .then(prependEmptyItem)
          .then(function(items) {
            $scope.cities = items;
          });

        $scope.updateCities = function() {
          var countries = $scope.attributes.countryCode;
          countries = !!countries ? [countries]
            : _.map(
              $scope.countries,
              function(item) {
                return item.code;
              }
            );

          UtilsService.getCities(countries).$promise.then(function(items) {
            $scope.cities = prependEmptyItem(items);
            var codes = _.map(items, function(item) {
              return item.code;
            });
            if (!_.contains(codes, $scope.attributes.cityCode)) {
              $scope.attributes.cityCode = '';
            }
          });
        };

        $scope.updateCountries = function() {
          var regions = $scope.attributes.regionCode;
          regions = !!regions ? [regions]
            : _.map(
              $scope.regions,
              function(item) {
                return item.code;
              }
            );
          UtilsService.getCountries(regions).$promise.then(function(items) {
            $scope.countries = prependEmptyItem(items);
            var codes = _.map(items, function(item) {
              return item.code;
            });
            if (!_.contains(codes, $scope.attributes.countryCode)) {
              $scope.attributes.countryCode = '';
            }
            $scope.updateCities($scope.attributes.countryCode);
          });
        };

        $scope.validatePackage = function() {
          $scope.validationErrors = [];
          PackageService.validateFiscalDataPackage()
            .then(function(results) {
              if (results.valid) {
                $scope.validationErrors = null;
              } else {
                $scope.validationErrors = results.errors;
              }
            })
            .catch(Configuration.defaultErrorHandler);
        };
      }
    ]);

})(angular);
