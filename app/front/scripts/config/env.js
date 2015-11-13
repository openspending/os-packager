;(function(angular) {

  var config = {
    defaultErrorHandler: console.trace.bind(console)
  };

  angular.module('Application')
    .constant('Configuration', config);

})(angular);
