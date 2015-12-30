;(function(angular) {

  var d3 = require('d3');
  var c3 = require('c3');

  angular.module('Visualization', [])
    .constant('d3', d3)
    .constant('c3', c3);

})(angular);
