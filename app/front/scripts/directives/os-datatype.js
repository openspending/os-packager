var OSTypes = require('os-types');
var _ = require('lodash');

;(function(angular) {

  angular.module('Application')
    .directive('osDatatype', [
      function() {
        return {
          restrict: 'E',
          templateUrl: 'templates/directives/os-datatype.html',
          replace: true,
          controller: ['$scope',
            function($scope) {
              return {
                sugg: '',
                setVal: function(val, clear) {
                  this.field.type = val;
                  if (clear) {
                    this.field.options = {};
                  }
                  this.onChanged();
                  $scope.$applyAsync();
                }
              };
            }
          ],
          controllerAs: 'ctrl',
          bindToController: {
            field: '=',
            onChanged: '&'
          },
          link: function($scope, element, attr, ctrl) {
            var input = element.find('.typeahead')[0];
            var clear = element.find('.clear')[0];
            var ot = new OSTypes();
            var sep = ' ❯ ';
            $(input).typeahead({
              minLength: 0,
              highlight: true
            }, {
              limit: 100,
              source: function(query, sync) {
                query = query.replace(new RegExp(sep,'g'),':');
                sync(_.map(ot.autoComplete(query), function(sugg) {
                  return {
                    val: sugg,
                    text: _.trimEnd(sugg, ':').replace(/:/g,sep),
                    leaf: _.last(sugg) != ':'
                  };
                }));
              },
              display: function(sugg) {
                return sugg.text;
              },
              templates: {
                suggestion: function(sugg) {
                  var suffix;
                  if (!sugg.leaf) {
                    suffix = ' ❯ ';
                  } else {
                    suffix = '';
                  }
                  var ret = _.last(_.split(sugg.text, sep)) + suffix;
                  return '<div>' + ret + '</div>';
                }
              }
            });
            if (ctrl.field.type) {
              ctrl.sugg = ctrl.field.type;
              $(input).typeahead('val', ctrl.field.type.replace(/:/g,sep));
              ctrl.setVal(ctrl.field.type, false);
            }
            $(input).bind('typeahead:select', function(ev, sugg) {
              ctrl.sugg = sugg.val;
              if (!sugg.leaf) {
                window.setTimeout(function() {
                  $(input).typeahead('val', sugg.text + sep);
                  $(input).typeahead('open');
                }, 100);
                $scope.$applyAsync();
              } else {
                ctrl.setVal(sugg.val, true);
              }
            });
            $(clear).bind('click', function() {
              $(input).typeahead('val','');
              ctrl.sugg = '';
              ctrl.setVal('', true);
            });
          }
        };
      }
    ]);

})(angular);
