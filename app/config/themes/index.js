'use strict';

var OSStyles = require('os-styles');
var themes = {
  default: require('./default')
};

module.exports = new OSStyles(themes);
