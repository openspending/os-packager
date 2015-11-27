;(function(angular, undefined) {

  var _ = require('underscore');

  angular.module('Application')
    .controller('ProvideMetadataController', [
      '$scope', 'PackageService', 'UtilsService', 'ValidationService',
      function($scope, PackageService, UtilsService, ValidationService) {
        $scope.attributes = PackageService.getPackage().attributes;

        $scope.$watch('attributes.title', function(value) {
          if ($scope.attributes) {
            $scope.attributes.name = UtilsService.slug(value);
          }
        });

        var updatePeriod = function() {
          if ($scope.attributes) {
            $scope.attributes.fiscalPeriod = UtilsService.prepareFiscalPeriod(
              $scope.period);
          }
        };

        $scope.$watch('period.start', updatePeriod);
        $scope.$watch('period.end', updatePeriod);

        var prependEmptyItem = function(items) {
          return _.union([{
            code: '',
            name: ''
          }], items);
        };

        $scope.regions = prependEmptyItem([]);
        $scope.countries = prependEmptyItem([]);

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
          });
        };

        $scope.validatePackage = function() {
          $scope.validationState = ValidationService.validateFiscalDataPackage(
            PackageService.getPackage());
        };
      }
    ]);

})(angular);
