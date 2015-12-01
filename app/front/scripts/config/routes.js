;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .config([
      '$routeProvider', '$locationProvider', 'Configuration',
      function($routeProvider, $locationProvider, Configuration) {
        _.each(Configuration.steps, function(step) {
          $routeProvider
            .when(step.route, {
              templateUrl: step.templateUrl,
              controller: step.controller,
              step: step
            });
        });
        $routeProvider.otherwise({
          redirectTo: '/'
        });

        $locationProvider.html5Mode(true);
      }
    ]);

})(angular);
