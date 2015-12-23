;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('ProvideMetadataService', [
      '$rootScope', '$timeout', 'PackageService', 'UtilsService',
      'ValidationService', 'StepsService',
      function($rootScope, $timeout, PackageService, UtilsService,
        ValidationService, StepsService) {
        var result = {};

        var $scope = $rootScope.$new();
        result.scope = $scope;

        $scope.$step = StepsService.getStepById('metadata');
        $scope.$step.reset = function() {
          result.reset();
        };

        // Initialize scope variables
        result.reset = function() {
          $scope.$step.isPassed = false;
          $scope.attributes = PackageService.getAttributes();
        };
        result.reset();

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

        result.updateCountries = function() {
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

        result.validatePackage = function() {
          $timeout(function() {
            $scope.validationState = ValidationService
              .validateFiscalDataPackage();
          });
        };

        return result;
      }
    ]);

})(angular);
