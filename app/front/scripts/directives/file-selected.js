'use strict';

angular.module('Application')
  .directive('ngFileSelected', [
    '$timeout', '$compile',
    function($timeout, $compile) {
      return {
        restrict: 'A',
        link: function(scope, element, attr) {
          var localScope = scope.$new();
          element.on('change', function() {
            localScope.files = this.files;
            element.replaceWith($compile(element.clone())(scope));
            $timeout(function() {
              localScope.$eval(attr.ngFileSelected);
              localScope.files = undefined;
            });
          });
        }
      };
    }
  ]);
