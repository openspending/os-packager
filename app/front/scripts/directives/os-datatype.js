'use strict';

var OSTypes = require('os-types');
var _ = require('lodash');

angular.module('Application')
  .directive('osDatatype', [
    function() {
      var sep = ' ❯ ';
      var convertCompletionToSuggestion = function(completion) {
        return {
          val: completion.type,
          displayName: completion.displayName,
          description: completion.description,
          group: completion.group,
          text: completion.displayName + ' (' + _.trimEnd(completion.type, ':')
            .replace(/:/g,sep) + ')',
          leaf: _.last(completion.type) != ':'
        };
      };
      return {
        restrict: 'E',
        templateUrl: 'templates/directives/os-datatype.html',
        replace: true,
        controller: [
          function() {
            var sugg = '';
            return {
              setSugg: function(_sugg) {
                sugg = _sugg;
              },
              getSugg: function() {
                return sugg;
              },
              isIncomplete: function() {
                return _.endsWith(sugg, ':');
              },
              setVal: function(val, clear) {
                this.field.type = val;
                if (clear) {
                  this.field.options = {};
                }
                this.onChanged();
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
          $(input).typeahead({
            minLength: 0,
            highlight: true
          }, {
            limit: 100,
            source: function(query, sync) {
              query = $(input).attr('data-code');
              sync(_.map(ot.autoComplete(query),
                convertCompletionToSuggestion));
            },
            display: function(sugg) {
              return sugg.text;
            },
            templates: {
              suggestion: function(sugg) {
                var suffix;
                if (!sugg.leaf) {
                  suffix = sep;
                } else {
                  suffix = '';
                }
                var ret = sugg.displayName + suffix;
                var group = !sugg.group ? '' :
                  '<div class="group">' + sugg.group.substring(4) + '</div>';
                var groupClass = sugg.group ? 'grouped' : '';
                return '<div class="suggestion-content ' + groupClass + '">' +
                  '<div>' + group + ret + '</div>' +
                  '<div class="suggestion-tooltip">' + sugg.description +
                  '</div>' +
                  '</div>';
              }
            }
          });
          var selectSugg = function(sugg, clear) {
            var currentCode = $(input).attr('data-code');
            $(input).attr('data-code', sugg.val);
            ctrl.setSugg(sugg.val);
            if (!sugg.leaf) {
              window.setTimeout(function() {
                $(input).typeahead('val', sugg.text + sep);
                $(input).typeahead('open');
              }, 100);
            } else {
              ctrl.setVal(sugg.val, currentCode != sugg.val && clear);
            }
            $scope.$applyAsync();
          };
          if (ctrl.field.type) {
            var completion = ot.autoComplete(ctrl.field.type)[0];
            var sugg = convertCompletionToSuggestion(completion);
            selectSugg(sugg, false);
            $(input).typeahead('val',sugg.text);
          }
          $(input).bind('typeahead:select', function(ev, sugg) {
            selectSugg(sugg, true);
          });
          $(clear).bind('click', function() {
            $(input).attr('data-code', '');
            $(input).typeahead('val','');
            ctrl.setSugg('');
            ctrl.setVal(null, true);
            $scope.$applyAsync();
          });
        }
      };
    }
  ]);
