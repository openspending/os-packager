;(function(angular) {

  angular.module('Application')
    .controller('ProvideMetadataController', [
      '$scope', 'PackageService', 'UtilsService',
      function($scope, PackageService, UtilsService) {
        $scope.attributes = PackageService.getPackage().attributes;

        $scope.$watch('attributes.title', function(value) {
          $scope.attributes.name = UtilsService.slug(value);
        });
      }
    ]);

})(angular);
