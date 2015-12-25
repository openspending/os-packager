;(function(angular) {

  var config = {
    defaultErrorHandler: function(error) {
      (console.trace || console.log || function() {})(error);
    },
    events: {
      CONCEPTS_CHANGED: 'package.conceptsChanged'
    },
    steps: require('app/services').data.steps
  };

  angular.module('Application')
    .constant('Configuration', config);

})(angular);
