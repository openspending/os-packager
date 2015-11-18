;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('UtilsService', [
      '$q',
      function($q) {
        var allRegions = null;
        var allCountries = null;

        return {
          getContentsFromFile: function(file) {
            var result = $q(function(resolve, reject) {
              var reader = new FileReader();
              reader.onload = function(event) {
                resolve(event.target.result);
              };
              reader.onerror = function() {
                reject(event.target.error);
              };
              reader.readAsText(file);
            });
            result.file = file;
            return result;
          },
          getContentsFromUrl: function(url) {
            var result = $q(function(resolve, reject) {
              $.get('/proxy', {url: url})
                .done(function(data) {
                  resolve(data);
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                  reject(errorThrown);
                });
            });
            result.url = url;
            return result;
          },
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
                  code: 'UK',
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
