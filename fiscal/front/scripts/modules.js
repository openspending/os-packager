/**
 * Import some modules - required for other stuff like Bootstrap and Angular
 */
(function(globals, require) {
  globals.$ = globals.jQuery = require('jquery');
  globals._ = require('underscore');
})(window, require);
