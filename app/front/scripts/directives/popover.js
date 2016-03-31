;(function(angular) {

  var app = angular.module('Application');

  app.directive('popover', [
    '$compile',
    function($compile) {
      return {
        template: '',
        replace: false,
        restrict: 'A',
        scope: false,
        link: function($scope, element, attrs) {
          var id = 'angular-popover-' + Date.now() + '-' +
            Math.round(Math.random() * 1000000);

          element.popover({
            placement: 'bottom',
            html: true,
            trigger: 'focus',
            content: function() {
              return '<div id="' + id + '">' +
                $(attrs.popover).html() + '<div>';
            }
          });

          element.on('shown.bs.popover', function() {
            $compile($('#' + id))($scope);
          });
        }
      };
    }
  ]);
})(angular);
