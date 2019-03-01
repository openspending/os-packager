'use strict';

angular.module('Application')
  .directive('ngFileSelectedRead', [
    '$timeout', '$compile', '$parse',
    function($timeout, $compile, $parse) {
      return {
        restrict: 'A',
        link: function(scope, element, attr) {
          var fn = $parse(attr.ngFileSelectedRead);
          element.on('change', function(onChangeEvent) {
            var reader = new FileReader();
            reader.onload = function(onLoadEvent) {
              scope.$apply(function() {
                fn(scope, {$fileContent: onLoadEvent.target.result});
              });
            };
            if (this.files.length) {
              scope.schema.file = this.files[0].name;
              reader.readAsText(
                (onChangeEvent.srcElement || onChangeEvent.target).files[0]);
            }

            $timeout(function() {
              element.val(null);
            });
          });
        }
      };
    }
  ]);
