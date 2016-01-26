;(function(angular) {

  angular.module('Application')
    .factory('StorageService', [
      '$q', '$window', '_', 'ApplicationState', 'Configuration',
      function($q, $window, _, ApplicationState, Configuration) {
        // Helper functions
        function isStorageAvailable() {
          return !!$window._indexedDB ||
            !!$window.indexedDB ||
            !!$window.msIndexedDB ||
            !!$window.mozIndexedDB ||
            !!$window.webkitIndexedDB ||
            !!window.openDatabase; // there is WebSQL polyfill
        }

        function deepCloneValue(value) {
          return (function(value, undefined) {
            if (value === undefined) {
              return undefined;
            }
            return JSON.parse(JSON.stringify(value));
          })(value);
        }

        function prepareValueForSaving(value) {
          if (_.isArray(value)) {
            return _.chain(value)
              .filter(function(value) {
                return !_.isFunction(value);
              })
              .map(prepareValueForSaving)
              .value();
          }
          if (_.isObject(value)) {
            var result = {};
            _.each(value, function(value, key) {
              var isFunction = _.isFunction(value);
              var isAngular = ('' + key).substr(0, 1) == '$';
              if (!isFunction && !isAngular) {
                result[key] = prepareValueForSaving(value);
              }
            });
            return result;
          }
          return _.isFunction(value) ? null : value;
        }

        // Require modules
        var state = null;
        if (isStorageAvailable()) {
          var websql = require('treo/plugins/treo-websql');
          var treo = require('treo');

          // Describe db schema and connect to db
          var schema = treo.schema()
            .version(1)
            .addStore(Configuration.storage.collection, {
              key: 'key',
              increment: false
            });

          var db = treo('fiscal-data-packager', schema).use(websql());

          state = db.store(Configuration.storage.collection);
        }

        var result = {
          get: function(key) {
            return $q(function(resolve, reject) {
              if (state) {
                state.get(key, function(error, result) {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result ? result.value : null);
                  }
                });
              } else {
                resolve(null);
              }
            });
          },
          set: function(key, value) {
            return $q(function(resolve, reject) {
              if (state) {
                state.put({
                  key: key,
                  value: value
                }, function(error, result) {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                });
              } else {
                resolve(false);
              }
            }).then(function() {}); // Force execute
          },
          saveApplicationState: function() {
            var state = prepareValueForSaving(deepCloneValue(ApplicationState));
            return result.set(Configuration.storage.key, state);
          },
          restoreApplicationState: function() {
            return $q(function(resolve) {
              result.get(Configuration.storage.key)
                .then(function(value) {
                  _.extend(ApplicationState, value);
                  resolve();
                })
                .catch(function() {
                  resolve(true);
                });
            });
          }
        };

        return result;
      }
    ]);

})(angular);
