;(function(angular) {

  angular.module('Application')
    .config([
      '$routeProvider', '$locationProvider', '_', 'Configuration',
      function($routeProvider, $locationProvider, _, Configuration) {
        $routeProvider.when('/login-success', {
            templateUrl: '/templates/login-success.html',
            controller: 'LoginSuccessController'
        });
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
