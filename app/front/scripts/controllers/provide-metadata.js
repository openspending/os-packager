;(function(angular, undefined) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('ProvideMetadataController', [
      '$scope', 'PackageService', 'UtilsService', 'Configuration',
      function($scope, PackageService, UtilsService, Configuration) {
        $scope.attributes = PackageService.getPackage().attributes;

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

        $scope.regions = UtilsService.getRegions();
        $scope.countries = UtilsService.getCountries();
        $scope.cities = UtilsService.getCities();

        $scope.updateCities = function() {
          var countries = $scope.attributes.countryCode;
          countries = _.isArray(countries) ? countries : [];
          if (countries.length == 0) {
            countries = _.map(
              $scope.countries,
              function(item) {
                return item.code;
              }
            );
          }
          UtilsService.getCities(countries).$promise.then(function(items) {
            $scope.cities = items;
            var codes = _.map(items, function(item) {
              return item.code;
            });
            $scope.attributes.cityCode = _.intersection(codes,
              $scope.attributes.cityCode);
          });
        };

        $scope.updateCountries = function() {
          var regions = $scope.attributes.regionCode;
          regions = _.isArray(regions) ? regions : [];
          if (regions.length == 0) {
            regions = _.map(
              $scope.regions,
              function(item) {
                return item.code;
              }
            );
          }
          UtilsService.getCountries(regions).$promise.then(function(items) {
            $scope.countries = items;
            var codes = _.map(items, function(item) {
              return item.code;
            });
            $scope.attributes.countryCode = _.intersection(codes,
              $scope.attributes.countryCode);
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
