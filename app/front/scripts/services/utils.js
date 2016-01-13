;(function(angular) {

  angular.module('Application')
    .factory('UtilsService', [
      '$q', '_', 'Services',
      function($q, _, Services) {
        var utils = Services.utils;

        var allContinents = null;
        var allCountries = null;
        var allCurrencies = null;

        return {
          slug: function(string) {
            return utils.convertToSlug(string);
          },
          decorateProxyUrl: function(url) {
            return utils.decorateProxyUrl(url);
          },
          undecorateProxyUrl: function(url) {
            return utils.undecorateProxyUrl(url);
          },
          findConcept: function(conceptId) {
            return _.find(utils.availableConcepts, function(concept) {
              return concept.id == conceptId;
            });
          },
          getAvailableConcepts: function() {
            return utils.availableConcepts;
          },
          getAvailableTypes: function() {
            return utils.availableDataTypes;
          },
          promisify: function(alienPromise) {
            return $q(function(resolve, reject) {
              alienPromise.then(resolve).catch(reject);
            });
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
              Services.cosmopolitan.getCurrencies(true)
                .then(resolve)
                .catch(reject);
            });
            result.$promise.then(function(items) {
              [].push.apply(result, items);
              return items;
            });
            allCurrencies = result;

            result.$promise.then(function(currencies) {
              Services.utils.setAvailableCurrencies(currencies);
              return currencies;
            });
            return result;
          },

          getContinents: function() {
            if (allContinents) {
              return allContinents;
            }
            var result = [];
            result.$promise = $q(function(resolve, reject) {
              Services.cosmopolitan.getContinents(true)
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
                      return _.contains(continent, country.continent);
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
                Services.cosmopolitan.getCountries(true)
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

})(angular);
