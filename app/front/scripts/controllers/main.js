;(function(angular) {

  angular.module('Application')
    .controller('MainController', [
      '$scope',
      function($scope) {
        $scope.message = 'Hello, World!';
      }
    ]);

})(angular);
