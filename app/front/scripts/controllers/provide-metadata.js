;(function(angular, undefined) {

  angular.module('Application')
    .controller('ProvideMetadataController', [
      '$scope', 'PackageService', 'ProvideMetadataService',
      'ApplicationLoader',
      function($scope, PackageService, ProvideMetadataService,
        ApplicationLoader) {
        ApplicationLoader.then(function() {
          $scope.geoData = ProvideMetadataService.getGeoData();
          $scope.state = ProvideMetadataService.getState();

          $scope.attributes = PackageService.getAttributes();

          $scope.$watch('attributes.title', function() {
            if ($scope.attributes) {
              ProvideMetadataService.updatePackageName();
            }
          });

          $scope.$watch('period.start', function(value) {
            ProvideMetadataService.updateFiscalPeriod(value);
          });
          $scope.$watch('period.end', function(value) {
            ProvideMetadataService.updateFiscalPeriod(value);
          });

          $scope.$watch('attributes.regionCode', function() {
            ProvideMetadataService.updateCountries();
            $scope.geoData = ProvideMetadataService.getGeoData();
          });

          $scope.onValidatePackage = function() {
            $scope.state = ProvideMetadataService.validatePackage();
          }
        });
      }
    ]);

})(angular);
