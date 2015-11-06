;(function(angular) {

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
          }
        };
      }
    ]);

})(angular);
