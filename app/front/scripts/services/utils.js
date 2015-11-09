;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('UtilsService', [
      '$q',
      function($q) {
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
          }
        };
      }
    ]);

})(angular);
