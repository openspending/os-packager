;(function(angular) {

  var config = {
    defaultErrorHandler: (console.trace || console.log).bind(console)
  };

  angular.module('Application')
    .constant('Configuration', config);

})(angular);
