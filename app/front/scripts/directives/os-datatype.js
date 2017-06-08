'use strict';

var OSTypes = require('os-types');
var $ = require('jquery');
require('jquery.mmenu/dist/jquery.mmenu.js');
require('jquery.mmenu/dist/addons/navbars/jquery.mmenu.navbars.js');
require('jquery.mmenu/dist/addons/searchfield/jquery.mmenu.searchfield.js');
require('jquery.mmenu/dist/addons/lazysubmenus/jquery.mmenu.lazysubmenus.js');

angular.module('Application')
  .directive('osDatatype', [
    '$timeout',
    function($timeout) {
      return {
        restrict: 'E',
        templateUrl: 'templates/directives/os-datatype.html',
        replace: true,
        controllerAs: 'ctrl',
        bindToController: {
          field: '=',
          onChanged: '&'
        },
        controller: [
          function() {
            return {
              convertOSTypesDescriptions: function convertOSTypesDescriptions(OSTypesDescriptions) {
                var result = [];

                Object.keys(OSTypesDescriptions).forEach(function (key) {
                  var data = OSTypesDescriptions[key];
                  var keyParts = key.replace(/:$/, '').split(':');

                  // This returns an array like ['foo', 'foo:bar', 'foo:bar:baz']
                  var intermediaryKeys = keyParts.map(function (_, index, array) {
                    return array.slice(0, index + 1).join(':');
                  });

                  var currentArray = result;
                  intermediaryKeys.forEach(function (key) {
                    var subArray = currentArray.find(function (element) {
                      return element.key === key;
                    });

                    if (subArray) {
                      subArray.types = subArray.types || [];
                      currentArray = subArray.types;
                    } else {
                      var currentData = Object.assign(
                        {
                          key: key,
                          types: [],
                        },
                        data
                      );
                      currentArray.push(currentData);
                      currentArray = currentData.types;
                    }
                  });
                });

                return result;
              }
            };
          }
        ],
        link: function($scope, element, attr, ctrl) {
          var menu = $('nav', element);
          var osTypes = new OSTypes();

          $scope.dataTypes = ctrl.convertOSTypesDescriptions(osTypes.typesDescriptions);

          $scope.openMenu = function() {
            $scope.showMenu = true;
          };

          $scope.closeMenu = function() {
            $scope.showMenu = false;
          };

          $scope.selectItem = function(item) {
            if (item.types === undefined || item.types.length == 0) {
              $scope.field.type = item.key;
              $scope.closeMenu();
              if ($scope.onChanged) {
                $scope.onChanged();
              }
            }
          };

          // Need to use $timeout to allow Angular to build the navigation from the data
          $timeout(function () {
            menu.mmenu({
              offCanvas: false,
              navbar: {
                title: false,
              },
              navbars: [
                {
                  position: 'top',
                  content: [
                    'searchfield',
                    '<a class="fa fa-times close" aria-hidden="true" title="Close"></a>',
                  ],
                },
              ],
              lazySubmenus: true,
              extensions: [
                'multiline',
              ],
            });

            $('.close', menu).click(function() {
              $scope.$apply($scope.closeMenu);
            });
          });
        },
      };
    }
  ]);
