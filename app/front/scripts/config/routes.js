;(function(angular) {

  angular.module('Application')
    .config([
      '$routeProvider', '$locationProvider', '_', 'Configuration',
      function($routeProvider, $locationProvider, _, Configuration) {
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
