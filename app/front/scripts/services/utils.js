;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('UtilsService', [
      '$q',
      function($q) {
        var allRegions = null;
        var allCountries = null;

        return {
          slug: function(string) {
            var utils = require('app/services').utils;
            return utils.convertToSlug(string);
          },
          getAvailableDataTypes: function() {
            var utils = require('app/services').utils;
            var result = utils.getAvailableDataTypes();
            return _.map(result, function(type) {
              type = _.clone(type);
              type.id = type.name;
              return type;
            });
          },
          getAvailableConcepts: function() {
            var utils = require('app/services').utils;
            var result = utils.getAvailableConcepts();
            return _.union([{
              name: '',
              id: ''
            }], result);
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

          getRegions: function() {
            if (allRegions) {
              return allRegions;
            }
            var result = [];
            result.$promise = $q(function(resolve, reject) {
              result.push({
                code: 'Europe',
                name: 'Europe'
              });
              result.push({
                code: 'Asia',
                name: 'Asia'
              });
              resolve(result);
            });
            result.$promise.then(_.identity); // It should load anyway
            allRegions = result;
            return result;
          },
          getCountries: function getCountries(region) {
            if (!region && allCountries) {
              // If region is not available, use cache (all countries)
              return allCountries;
            }
            var result = [];
            result.$promise = $q(function(resolve, reject) {
              if (!!region) {
                // If region is available, try to load all countries, and then
                // filter them. Resolve with filtered array
                getCountries().$promise.then(function(countries) {
                  var filtered = [];
                  if (_.isArray(region)) {
                    filtered = _.filter(countries, function(country) {
                      return _.contains(region, country.region);
                    });
                  } else {
                    filtered = _.filter(countries, function(country) {
                      return country.region == region;
                    });
                  }

                  [].push.apply(result, filtered);
                  resolve(result);
                }).catch(reject);
              } else {
                // If region is not available, just load all countries
                result.push({
                  code: 'GB',
                  name: 'Great Britain',
                  region: 'Europe'
                });
                result.push({
                  code: 'UA',
                  name: 'Ukraine',
                  region: 'Europe'
                });
                result.push({
                  code: 'CN',
                  name: 'China',
                  region: 'Asia'
                });
                resolve(result);
              }
            });
            result.$promise.then(_.identity); // It should load anyway
            if (!region) {
              // If region is not available, cache all countries
              allCountries = result;
            }
            return result;
          }
        };
      }
    ]);

})(angular);
