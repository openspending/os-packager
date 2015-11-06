;(function(angular) {

  var _ = require('underscore');

  angular.module('Application')
    .factory('UtilsService', [
      '$q',
      function($q) {
        return {
          getContentsFromFile: function(file) {
            return $q(function(resolve, reject) {
              var reader = new FileReader();
              reader.onload = function(event) {
                resolve(event.target.result);
              };
              reader.onerror = function() {
                reject(event.target.error);
              };
              reader.readAsText(file);
            });
          },
          getContentsFromUrl: function(url) {
            return $q(function(resolve, reject) {
              $.get('/proxy', {url: url})
                .done(function(data) {
                  resolve(data);
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                  reject(errorThrown);
                });
            });
          },
          getAvailableDataTypes: function() {
            var CsvValidateService = require('app/services').csvValidate;
            var result = CsvValidateService.getAvailableDataTypes();
            return _.map(result, function(type) {
              type = _.clone(type);
              type.id = type.name;
              return type;
            });
          },
          getAvailableConcepts: function() {
            var CsvValidateService = require('app/services').csvValidate;
            var result = CsvValidateService.getAvailableConcepts();
            return _.union([{
              name: '',
              id: ''
            }], result);
          }
        };
      }
    ]);

})(angular);
