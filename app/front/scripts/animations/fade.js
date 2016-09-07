'use strict';

angular.module('Application')
  .animation('.fade-animation', [
    function() {
      return {
        enter: function(element, doneFn) {
          $(element).hide().fadeIn(100, doneFn);
        },
        leave: function(element, doneFn) {
          $(element).fadeOut(100, doneFn);
        }
      };
    }
  ]);
