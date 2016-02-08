'use strict';

var _ = require('underscore');
require('isomorphic-fetch');

var cosmopolitanApiUrl = 'http://cosmopolitan.openspending.org/?format=json';

function upper(v) {
  return (v + '').toUpperCase();
}

function processFetchResponse(response) {
  if (response.status != 200) {
    throw 'Failed loading data from ' + response.url;
  }
  return response.text().then(JSON.parse);
}

function getItemsFromSource(source, useProxy) {
  useProxy = !!useProxy;

  var url = cosmopolitanApiUrl;
  if (useProxy) {
    url = '/proxy?url=' + encodeURIComponent(url);
  }

  var options = {
    method: 'GET'
  };

  return fetch(url, options).then(processFetchResponse)
    .then(function(sources) {
      if (!sources[source]) {
        throw 'Source "' + source + '" is not available';
      }

      var allResults = [];
      var fetchNext = function(url, options) {
        if (useProxy) {
          url = '/proxy?url=' + encodeURIComponent(url);
        }

        return fetch(url, options).then(processFetchResponse)
          .then(function(results) {
            if (_.isArray(results.results)) {
              [].push.apply(allResults, results.results);
            }
            if (_.isArray(results)) {
              [].push.apply(allResults, results);
            }
            if (!!results.next) {
              return fetchNext(results.next, options);
            }
            return allResults;
          });
      };
      return fetchNext(sources[source], options);
    });
}

module.exports.getCountries = function(useProxy) {
  return getItemsFromSource('countries', useProxy).then(function(items) {
    return _.map(items, function(item) {
      return {
        code: item.id,
        name: item.name,
        continent: _.isObject(item.continent) ? item.continent.id : null,
        currency: _.isObject(item.currency) ? upper(item.currency.id) : null
      };
    });
  });
};

module.exports.getContinents = function(useProxy) {
  return getItemsFromSource('continents', useProxy).then(function(items) {
    return _.map(items, function(item) {
      return {
        code: item.id,
        name: item.name
      };
    });
  });
};

module.exports.getCurrencies = function(useProxy) {
  return getItemsFromSource('currencies', useProxy).then(function(items) {
    return _.map(items, function(item) {
      return {
        name: item.name,
        code: upper(item.id)
      };
    });
  });
};
