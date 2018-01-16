'use strict';

require('isomorphic-fetch');
var Promise = require('bluebird');

var cache = {};

module.exports = {
  get: function(url, options, bypassCache) {
    if (bypassCache || !cache[url]) {
      var requestPromise = fetch(url, options).then(function(response) {
        if (response.status != 200) {
          throw new Error('Failed loading data from ' + response.url);
        }
        return response.text();
      });

      if (bypassCache) {
        return requestPromise;
      }
      cache[url] = requestPromise;
    }
    return new Promise(function(resolve, reject) {
      cache[url].then(resolve).catch(reject);
    });
  },
  getJson: function(url, options, bypassCache) {
    return this.get(url, options, bypassCache).then(JSON.parse);
  },
  clearCache: function() {
    cache = {};
  }
};
