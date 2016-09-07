'use strict';

angular.module('Application')
  .filter('numberFormat', [
    function() {
      return function(input, fractionDigits) {
        input = parseFloat(input);
        if (!isFinite(input)) {
          input = 0.0;
        }
        fractionDigits = parseFloat(fractionDigits);
        if (isFinite(fractionDigits) && (fractionDigits >= 1)) {
          fractionDigits = Math.floor(fractionDigits);
          input = input.toFixed(fractionDigits);
          return input.replace(/\.?0*$/,''); // Remove trailing zeros
        } else {
          return Math.round(input);
        }
      };
    }
  ]);
