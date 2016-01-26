;(function(angular) {

  angular.module('Application')
    .factory('StorageService', [
      '$q', '_', 'ApplicationState', 'Configuration',
      function($q, _, ApplicationState, Configuration) {
        // Helper functions
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

        var state = db.store(Configuration.storage.collection);

        var result = {
          get: function(key) {
            return $q(function(resolve, reject) {
              state.get(key, function(error, result) {
                if (error) {
                  reject(error);
                } else {
                  resolve(result.value);
                }
              });
            });
          },
          set: function(key, value) {
            return $q(function(resolve, reject) {
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
            }).then(function() {}); // Force execute
          },
          saveApplicationState: function() {
            var state = prepareValueForSaving(deepCloneValue(ApplicationState));
            result.set(Configuration.storage.key, state);
          },
          restoreApplicationState: function() {
            return result.get(Configuration.storage.key).then(function(value) {
              _.extend(ApplicationState, value);
              return ApplicationState;
            });
          }
        };

        return result;
      }
    ]);

})(angular);
