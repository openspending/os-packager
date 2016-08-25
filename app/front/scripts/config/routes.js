'use strict';

var _ = require('lodash');

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
  ])
  .run([
    '$route',
    function($route) {
      // Capture initial $locationChangeStart event; otherwise ngView will
      // not work (f*cking "known" issue since `angular-route@1.5.5`)
    }
  ]);
