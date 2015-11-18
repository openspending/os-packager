;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .filter('join', [
      function() {
        return function(input, separator) {
          if (_.isArray(input)) {
            return _.filter(input).join(separator || ', ');
          }
          return input;
        };
      }
    ]);

})(angular);
