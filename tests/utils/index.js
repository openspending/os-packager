'use strict';

var _ = require('underscore');

// For PapaParse
// xmlhttprequest lib has no onload/onerror properties, but papaparse relies on
// them. This code should fix it
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
GLOBAL.XMLHttpRequest = function(options) {
  var eventOnLoad = undefined;
  var eventOnError = undefined;
  var result = new XMLHttpRequest(options);

  Object.defineProperty(result, 'onload', {
    enumerable: true,
    get: function() {
      return eventOnLoad;
    },
    set: function(value) {
      if (_.isFunction(eventOnLoad)) {
        result.removeEventListener('load', eventOnLoad);
      }
      eventOnLoad = value;
      if (_.isFunction(eventOnLoad)) {
        result.addEventListener('load', eventOnLoad);
      }
    }
  });
  Object.defineProperty(result, 'onerror', {
    enumerable: true,
    get: function() {
      return eventOnError;
    },
    set: function(value) {
      if (_.isFunction(eventOnError)) {
        result.removeEventListener('error', eventOnError);
      }
      eventOnError = value;
      if (_.isFunction(eventOnLoad)) {
        result.addEventListener('error', eventOnError);
      }
    }
  });
  return result;
};

module.exports.app = require('./app');
