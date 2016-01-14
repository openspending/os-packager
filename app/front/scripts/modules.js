/**
 * Import some modules - required for other stuff like Bootstrap and Angular
 */
(function(globals, require) {
  globals.$ = globals.jQuery = require('jquery');
  require('isomorphic-fetch/fetch-npm-browserify'); // fetch() polyfill
})(window, require);
