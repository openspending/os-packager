'use strict';

require('js-polyfills/xhr');
require('isomorphic-fetch');

var _ = require('lodash');

// Init some global variables - needed for proper work of angular and
// some other 3rd-party libraries
(function(globals) {
  globals._ = _;

  var jquery = require('jquery');
  globals.jQuery = globals.$ = jquery;

  // fetch() polyfill
  require('isomorphic-fetch/fetch-npm-browserify');

  require('os-bootstrap/dist/js/os-bootstrap');

  var angular = require('angular');
  globals.angular = angular;
  if (typeof globals.Promise != 'function') {
    globals.Promise = require('bluebird');
  }

  globals.addEventListener('load', function() {
    require('./application');
    angular.bootstrap(globals.document, ['Application']);
  });
})(window || this);
