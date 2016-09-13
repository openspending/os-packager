'use strict';

var _ = require('lodash');

var utils = require('../../../services/utils');
var cosmopolitan = require('../../../services/cosmopolitan');

angular.module('Application')
  .factory('UtilsService', [
    '$q',
    function($q) {
      var allContinents = null;
      var allCountries = null;
      var allCurrencies = null;

      return {
        findConcept: function(osType) {
          return _.find(utils.availableConcepts, function(concept) {
            return concept.osType == osType;
          });
        },
        getAvailableConcepts: function() {
          return utils.availableConcepts;
        },
        prepareFiscalPeriod: function(period) {
          var range = [];
          var result = undefined;
          if (!!period) {
            range = _.filter([
              period.start || period.from,
              period.end || period.to
            ]);
          }
          switch (range.length) {
            case 1:
              result = {
                start: range[0]
              };
              break;
            case 2:
              result = {
                start: range[0],
                end: range[1]
              };
              break;
          }
          return result;
        },

        getCurrencies: function() {
          if (allCurrencies) {
            return allCurrencies;
          }
          var result = [];
          result.$promise = $q(function(resolve, reject) {
            cosmopolitan.getCurrencies(false)
              .then(resolve)
              .catch(reject);
          });
          result.$promise.then(function(items) {
            [].push.apply(result, items);
            return items;
          });
          allCurrencies = result;
          return result;
        },

        getDefaultCurrency: function() {
          return utils.getDefaultCurrency();
        },

        getContinents: function() {
          if (allContinents) {
            return allContinents;
          }
          var result = [];
          result.$promise = $q(function(resolve, reject) {
            cosmopolitan.getContinents(false)
              .then(resolve)
              .catch(reject);
          });
          result.$promise.then(function(items) {
            [].push.apply(result, items);
            return items;
          });
          allContinents = result;
          return result;
        },
        getCountries: function getCountries(continent) {
          if (!continent && allCountries) {
            // If continent is not available, use cache (all countries)
            return allCountries;
          }
          var result = [];
          result.$promise = $q(function(resolve, reject) {
            if (!!continent) {
              // If continent is available, try to load all countries,
              // and then filter them. Resolve with filtered array
              getCountries().$promise.then(function(countries) {
                var filtered = [];
                if (_.isArray(continent)) {
                  filtered = _.filter(countries, function(country) {
                    return !!_.find(continent, function(item) {
                      return item == country.continent;
                    });
                  });
                } else {
                  filtered = _.filter(countries, function(country) {
                    return country.continent == continent;
                  });
                }

                [].push.apply(result, filtered);
                resolve(result);
              }).catch(reject);
            } else {
              // If continent is not available, just load all countries
              cosmopolitan.getCountries(false)
                .then(resolve)
                .catch(reject);
            }
          });
          result.$promise.then(function(items) {
            [].push.apply(result, items);
            return items;
          });
          if (!continent) {
            // If continent is not available, cache all countries
            allCountries = result;
          }
          return result;
        }
      };
    }
  ]);
