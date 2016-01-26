;(function(angular) {

  angular.module('Application')
    .factory('ProvideMetadataService', [
      '$timeout', '_', 'PackageService', 'UtilsService',
      'ValidationService', 'ApplicationState', 'ApplicationLoader',
      function($timeout, _, PackageService, UtilsService,
        ValidationService, ApplicationState, ApplicationLoader) {
        var result = {};

        var geoData = {};

        var state = null;
        ApplicationLoader.then(function() {
          state = {};
          if (_.isObject(ApplicationState.provideMetadata)) {
            state = ApplicationState.provideMetadata;
          }
          ApplicationState.provideMetadata = state;
        });

        result.getState = function() {
          return state;
        };

        result.getGeoData = function() {
          return geoData;
        };

        result.updatePackageName = function() {
          var attributes = PackageService.getAttributes();
          attributes.name = UtilsService.slug(attributes.title);
        };

        result.updateFiscalPeriod = function(period) {
          if (period) {
            var attributes = PackageService.getAttributes();
            attributes.fiscalPeriod = UtilsService.prepareFiscalPeriod(period);
          }
        };

        var prependEmptyItem = function(items) {
          return _.union([{
            code: '',
            name: ''
          }], items);
        };

        geoData.regions = prependEmptyItem([]);
        geoData.countries = prependEmptyItem([]);

        UtilsService.getContinents().$promise
          .then(prependEmptyItem)
          .then(function(items) {
            geoData.regions = items;
          });

        // Preload countries, but do not show them until continent selected
        UtilsService.getCountries();
        geoData.countries = prependEmptyItem([]);

        result.updateCountries = function() {
          var attributes = PackageService.getAttributes();
          var regions = attributes.regionCode;
          regions = !!regions ? [regions]
            : _.map(
            geoData.regions,
            function(item) {
              return item.code;
            }
          );
          UtilsService.getCountries(regions).$promise.then(function(items) {
            var attributes = PackageService.getAttributes();
            geoData.countries = prependEmptyItem(items);
            var codes = _.map(items, function(item) {
              return item.code;
            });
            if (!_.contains(codes, attributes.countryCode)) {
              attributes.countryCode = '';
            }
          });
        };

        result.validatePackage = function() {
          $timeout(function() {
            state.status = ValidationService.validateFiscalDataPackage();
          });
          return state;
        };

        return result;
      }
    ]);

})(angular);
