;(function(angular) {

  angular.module('Application')
    .filter('join', [
      '_',
      function(_) {
        return function(input, separator) {
          if (_.isArray(input)) {
            return _.filter(input).join(separator || ', ');
          }
          return input;
        };
      }
    ]);

})(angular);
