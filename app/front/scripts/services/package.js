;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('PackageService', [
      '$q', 'UtilsService',
      function($q, UtilsService) {
        var data = {};
        var schema = {};
        var mapping = {};

        return {
          getSchema: function() {
            return schema;
          },
          getData: function() {
            return data;
          },
          getMapping: function() {
            return mapping;
          },

          addResource: function(fileOrUrl) {
            return $q(function(resolve, reject) {
              var CsvValidateService = require('app/services').csvValidate;
              var reader = null;
              if (_.isObject(fileOrUrl)) {
                reader = UtilsService.getContentsFromFile(fileOrUrl);
              } else {
                reader = UtilsService.getContentsFromUrl(fileOrUrl);
              }
              reader
                .then(function(data) {
                  return CsvValidateService.getCsvSchema(data);
                })
                .then(function(resource) {
                  return CsvValidateService.validateData(resource.data,
                    resource.schema).then(function(results) {
                      if (results.length == 0) {
                        data.headers = resource.headers;
                        data.rows = resource.rows;
                        data.bytes = resource.data;
                        schema = resource.schema;
                        _.each(schema.fields, function(field) {
                          field.concept = field.concept || '';
                          field.concept += '';
                        })
                      }
                      return results;
                    });
                })
                .then(resolve)
                .catch(reject);
            });
          }
        };
      }
    ]);

})(angular);
